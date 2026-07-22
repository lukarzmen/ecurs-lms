#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/root/ecurs-lms}"
BRANCH="${BRANCH:-main}"
PM2_NAME="${PM2_NAME:-ecurs-lms}"
LOG_FILE="${LOG_FILE:-${APP_DIR}/deploy.log}"
ROLLBACK_ON_ERROR="${ROLLBACK_ON_ERROR:-1}"

ENV_FILES=(
  ".env"
  ".env.local"
  ".env.production"
)

PREV_COMMIT=""
NEW_COMMIT=""
backup_dir=""

restore_env_files() {
  for f in "${ENV_FILES[@]}"; do
    if [[ -f "${backup_dir}/${f}" ]]; then
      cp -f "${backup_dir}/${f}" "${f}"
    fi
  done
}

rollback() {
  if [[ "${ROLLBACK_ON_ERROR}" != "1" ]]; then
    echo "==> Rollback skipped (ROLLBACK_ON_ERROR=${ROLLBACK_ON_ERROR})"
    return
  fi

  if [[ -z "${PREV_COMMIT}" ]]; then
    echo "==> Rollback skipped (missing PREV_COMMIT)"
    return
  fi

  if [[ -z "${NEW_COMMIT}" || "${NEW_COMMIT}" == "${PREV_COMMIT}" ]]; then
    echo "==> Rollback skipped (no new commit deployed)"
    return
  fi

  echo "==> Rolling back to ${PREV_COMMIT}"
  git reset --hard "${PREV_COMMIT}"
  restore_env_files
  npm ci
  npx prisma migrate deploy
  npm run build
  if pm2 describe "${PM2_NAME}" >/dev/null 2>&1; then
    pm2 restart "${PM2_NAME}" --update-env
  fi
  pm2 save
  echo "==> Rollback completed"
}

cleanup() {
  if [[ -n "${backup_dir}" && -d "${backup_dir}" ]]; then
    rm -rf "${backup_dir}"
  fi
}
trap cleanup EXIT

mkdir -p "${APP_DIR}"
touch "${LOG_FILE}"
exec > >(tee -a "${LOG_FILE}") 2>&1

echo "==> Deploy start: $(date -Is)"
echo "==> App dir: ${APP_DIR}"
echo "==> Branch: ${BRANCH}"
echo "==> PM2 process: ${PM2_NAME}"

for cmd in git npm npx pm2; do
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "ERROR: ${cmd} is not installed"
    exit 1
  fi
done

cd "${APP_DIR}"

status_output="$(git status --porcelain)"
if [[ -n "${status_output}" ]]; then
  echo "ERROR: repo has local changes. Commit/stash them first."
  printf '%s\n' "${status_output}"
  exit 1
fi

PREV_COMMIT="$(git rev-parse HEAD)"
backup_dir="$(mktemp -d)"

echo "==> Backing up env files"
for f in "${ENV_FILES[@]}"; do
  if [[ -f "${f}" ]]; then
    cp -a "${f}" "${backup_dir}/${f}"
  fi
done

set +e

echo "==> Fetching latest code"
git fetch origin "${BRANCH}"
git pull --ff-only origin "${BRANCH}"
pull_exit=$?

if [[ ${pull_exit} -eq 0 ]]; then
  NEW_COMMIT="$(git rev-parse HEAD)"
  restore_env_files

  echo "==> Installing dependencies"
  npm ci
  deploy_exit=$?

  if [[ ${deploy_exit} -eq 0 ]]; then
    echo "==> Running Prisma migrations"
    npx prisma migrate deploy
    deploy_exit=$?
  fi

  if [[ ${deploy_exit} -eq 0 ]]; then
    echo "==> Building app"
    npm run build
    deploy_exit=$?
  fi

  if [[ ${deploy_exit} -eq 0 ]]; then
    if pm2 describe "${PM2_NAME}" >/dev/null 2>&1; then
      echo "==> Restarting PM2 process: ${PM2_NAME}"
      pm2 restart "${PM2_NAME}" --update-env
      deploy_exit=$?
    else
      echo "==> Starting PM2 process: ${PM2_NAME}"
      pm2 start npm --name "${PM2_NAME}" -- start
      deploy_exit=$?
    fi
  fi

  if [[ ${deploy_exit} -eq 0 ]]; then
    pm2 save
    deploy_exit=$?
  fi
else
  deploy_exit=${pull_exit}
fi

set -e

if [[ ${deploy_exit} -ne 0 ]]; then
  echo "ERROR: deploy failed with code ${deploy_exit}"
  rollback
  exit ${deploy_exit}
fi

echo "==> Deployed commit: ${NEW_COMMIT}"
echo "==> Deploy finished successfully: $(date -Is)"
echo "==> Log file: ${LOG_FILE}"