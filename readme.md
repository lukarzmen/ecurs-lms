# Ecurs – Interactive Educational Platform

Ecurs is a modern, interactive educational platform designed by teachers for teachers and students. Replace boring worksheets with engaging, interactive educational materials. Create, manage, and sell online courses with ease. Ecurs is a full-stack application built with [Next.js](https://nextjs.org/) (frontend & backend).

---

## Features

- **Interactive Content Creation:** Build engaging lessons with quizzes, flashcards, matching tasks, and more.
- **AI-Powered Tools:** Use artificial intelligence to generate educational content and support students.
- **Course & Student Management:** Manage your courses, materials, and student groups in one place.
- **Marketplace:** Publish your courses to reach a wider audience.
- **Advanced Analytics:** Track student progress and course effectiveness.
- **Flexible Access:** Use Ecurs on desktop, tablet, or mobile devices.
- **Monetization:** Sell your courses or share them for free.

---

## Technology Stack

- **Next.js** – Full-stack React framework (frontend & backend in one codebase)
- **Clerk** – Authentication and user management
- **PostgreSQL** – Relational database for persistent storage
- **OpenAI** – AI-powered content generation
- **ElevenLabs** – Text-to-speech and voice features
- **Stripe** – Secure online payments and subscriptions

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/lukarzmen/ecurs-lms
cd ecurs-lms
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```


### 3. Configure environment variables
Copy the example environment file and fill in your own API keys and secrets:

```bash
cp .env.dev .env.local
```

Edit `.env` and provide your credentials for Clerk, PostgreSQL, OpenAI, ElevenLabs, Stripe, etc.

See [.env.dev](./.env.dev) for all required variables.

### 4. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [OpenAI API Docs](https://platform.openai.com/docs/)
- [ElevenLabs API Docs](https://docs.elevenlabs.io/)
- [Stripe Docs](https://stripe.com/docs)

---

## Deployment

You can deploy Ecurs to any platform that supports Node.js and PostgreSQL.

### Deploy on Vercel

The recommended way to deploy a Next.js app is with [Vercel](https://vercel.com/):

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Go to [Vercel](https://vercel.com/) and import your project.
3. Set up environment variables in the Vercel dashboard (copy from your `.env.local`).
4. Click **Deploy**.

Vercel will automatically build and deploy your app, including both frontend and backend (API routes).  
For more details, see the [Next.js deployment documentation](https://nextjs.org/docs/deployment).

---

### License

This project is licensed under the GNU Lesser General Public License (LGPL).  
See the [LICENSE](./LICENSE) file for details.

### Incoming features:
- Checked lists as a feature
- Checkbox support in the editor
- Integrated chat functionality
- Additional payment methods
- Invoicing support
- Marketing tools


