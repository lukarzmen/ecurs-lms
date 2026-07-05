"use client";

import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Trash2, CreditCard, Settings, User, Building } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/hooks/use-i18n";

interface UserCourse {
  id: number;
  course: {
    id: number;
    title: string;
  };
  purchase?: {
    subscriptionId?: string;
    isRecurring: boolean;
    subscriptionStatus?: string;
    currentPeriodEnd?: string;
  };
}

interface UserEducationalPath {
  id: number;
  educationalPath: {
    id: number;
    title: string;
  };
}

interface EducationalPathPurchase {
  id: number;
  educationalPath: {
    id: number;
    title: string;
  };
  subscriptionId?: string;
  isRecurring: boolean;
  subscriptionStatus?: string;
  currentPeriodEnd?: string;
}

interface UserProfile {
  id: number;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email: string;
  businessType?: string;
  companyName?: string;
  taxId?: string;
  requiresVatInvoices: boolean;
  stripeAccountStatus?: string;
  stripeOnboardingComplete: boolean;
  ownerSchoolType?: "individual" | "business" | null;
  isSchoolOwner?: boolean;
  isMemberOfSchool?: boolean;
  memberSchool?: { id: number; name: string; schoolType?: "individual" | "business" } | null;
}

interface PlatformSubscription {
  id: number;
  subscriptionType: string;
  subscriptionStatus?: string;
  currentPeriodEnd?: string;
  subscriptionId?: string;
  amount?: number;
  vatRate?: number;
  currency?: string;
  trialEnd?: string;
}

const PLATFORM_VAT_RATE = 0.23;
const PLATFORM_VAT_PERCENT = 23;

const calculateGrossPrice = (netPrice: number) => Number((netPrice * (1 + PLATFORM_VAT_RATE)).toFixed(2));
const calculateNetPrice = (grossPrice: number) => Number((grossPrice / (1 + PLATFORM_VAT_RATE)).toFixed(2));
const normalizeVatRate = (vatRate?: number) => {
  const raw = vatRate ?? PLATFORM_VAT_RATE;
  return raw > 1 ? raw / 100 : raw;
};
const formatPln = (price: number, locale: string) => price.toLocaleString(locale === 'en' ? 'en-US' : 'pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface StripeConnectInfo {
  hasAccount: boolean;
  onboardingComplete: boolean;
  accountId?: string;
  stripeBusinessType?: "individual" | "company" | null;
}

const TeacherSettingsPage = () => {
  const { userId, sessionId } = useAuth();
  const { t, locale } = useI18n();
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [educationalPathPurchases, setEducationalPathPurchases] = useState<EducationalPathPurchase[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [platformSubscription, setPlatformSubscription] = useState<PlatformSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [stripeRecreateConfirm, setStripeRecreateConfirm] = useState(false);
  const [isRecreatingStripe, setIsRecreatingStripe] = useState(false);
  const [stripeConnectInfo, setStripeConnectInfo] = useState<StripeConnectInfo | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    console.log('User Profile:', userProfile);
    console.log('Platform Subscription:', platformSubscription);
  }, [userProfile, platformSubscription]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user profile
      const profileResponse = await fetch('/api/user/profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserProfile(profileData);
      }

      // Fetch Stripe Connect details (best-effort)
      try {
        const stripeResponse = await fetch('/api/stripe/connect', { method: 'GET' });
        if (stripeResponse.ok) {
          const stripeData = await stripeResponse.json();
          setStripeConnectInfo(stripeData);
        }
      } catch {
        // ignore
      }

      // Fetch user courses with subscriptions
      const coursesResponse = await fetch('/api/student/courses');
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setUserCourses(coursesData.filter((course: UserCourse) => 
          course.purchase?.isRecurring && ['active', 'cancel_at_period_end'].includes(course.purchase?.subscriptionStatus || '')
        ));
      }

      // Fetch educational path purchases with subscriptions
      const pathsResponse = await fetch('/api/student/educational-paths');
      if (pathsResponse.ok) {
        const pathsData = await pathsResponse.json();
        setEducationalPathPurchases(pathsData.filter((purchase: EducationalPathPurchase) => 
          purchase.isRecurring && ['active', 'cancel_at_period_end'].includes(purchase.subscriptionStatus || '')
        ));
      }

      // Fetch platform subscription info
      try {
        const platformResponse = await fetch('/api/platform-subscription');
        if (platformResponse.ok) {
          const platformData = await platformResponse.json();
          setPlatformSubscription(platformData);
        }
      } catch (error) {
        console.log('Platform subscription not available yet - feature requires database migration');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t("tSet.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updatedProfile: Partial<UserProfile>) => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProfile),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setUserProfile(updatedData);
        toast.success(t("tSet.profileUpdated"));
      } else {
        toast.error(t("tSet.profileUpdateError"));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t("tSet.profileUpdateError"));
    } finally {
      setIsSaving(false);
    }
  };

  const cancelCourseSubscription = async (userCourseId: number, subscriptionId?: string) => {
    try {
      const response = await fetch(`/api/student/courses/${userCourseId}/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      });

      if (response.ok) {
        toast.success(t("tSet.courseSubCancelled"));
        fetchData(); // Refresh the data
      } else {
        toast.error(t("tSet.courseSubCancelError"));
      }
    } catch (error) {
      console.error('Error cancelling course subscription:', error);
      toast.error(t("tSet.courseSubCancelError"));
    }
  };

  const cancelEducationalPathSubscription = async (purchaseId: number, subscriptionId?: string) => {
    try {
      const response = await fetch(`/api/student/educational-paths/${purchaseId}/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      });

      if (response.ok) {
        toast.success(t("tSet.pathSubCancelled"));
        fetchData(); // Refresh the data
      } else {
        toast.error(t("tSet.pathSubCancelError"));
      }
    } catch (error) {
      console.error('Error cancelling educational path subscription:', error);
      toast.error(t("tSet.pathSubCancelError"));
    }
  };

  const subscribeToPlatform = async (subscriptionType: "individual" | "school") => {
    try {
      const response = await fetch('/api/platform-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          subscriptionType,
          returnUrl: '/teacher/settings'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.sessionUrl) {
          window.location.href = result.sessionUrl;
        }
      } else {
        toast.error(t("tSet.platformSubError"));
      }
    } catch (error) {
      console.error('Error creating platform subscription:', error);
      toast.error(t("tSet.platformSubError"));
    }
  };

  const cancelPlatformSubscription = async () => {
    if (!platformSubscription?.subscriptionId) return;

    try {
      const response = await fetch('/api/platform-subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId: platformSubscription.subscriptionId }),
      });

      if (response.ok) {
        toast.success(t("tSet.platformSubCancelled"));
        fetchData(); // Refresh the data
      } else {
        toast.error(t("tSet.platformSubCancelError"));
      }
    } catch (error) {
      console.error('Error cancelling platform subscription:', error);
      toast.error(t("tSet.platformSubCancelError"));
    }
  };

  const recreateStripeAccountAsCompany = async () => {
    try {
      if (!stripeRecreateConfirm) {
        toast.error(t("tSet.confirmRequired"));
        return;
      }

      setIsRecreatingStripe(true);

      const response = await fetch("/api/stripe/recreate-company-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg = result?.error || t("tSet.stripeCreateFailed");
        toast.error(msg);
        return;
      }

      if (result?.onboardingUrl) {
        toast.success(t("tSet.stripeCreating"));
        window.location.href = result.onboardingUrl;
        return;
      }

      toast.error(t("tSet.stripeNoLink"));
    } catch (error) {
      console.error("Error recreating Stripe account:", error);
      toast.error(error instanceof Error ? error.message : t("tSet.genericError"));
    } finally {
      setIsRecreatingStripe(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("tSet.pageTitle")}</h1>
        <p className="text-muted-foreground">{t("tSet.pageDesc")}</p>
      </div>



      {/* Profile Settings */}
      {userProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("tSet.profileTitle")}
            </CardTitle>
            <CardDescription>
              {t("tSet.profileDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">{t("tSet.firstName")}</Label>
                <Input
                  id="firstName"
                  value={userProfile.firstName || ''}
                  onChange={(e) => setUserProfile({...userProfile, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="lastName">{t("tSet.lastName")}</Label>
                <Input
                  id="lastName"
                  value={userProfile.lastName || ''}
                  onChange={(e) => setUserProfile({...userProfile, lastName: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="displayName">{t("tSet.displayName")}</Label>
              <Input
                id="displayName"
                value={userProfile.displayName || ''}
                onChange={(e) => setUserProfile({...userProfile, displayName: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="businessType">{t("tSet.businessType")}</Label>
              <div className="p-2 border rounded-md bg-gray-50 flex items-center justify-between">
                <span className="text-sm">
                  {userProfile.businessType === 'individual' ? t("tSet.individual") : t("tSet.company")}
                </span>
                {userProfile.businessType === 'individual' && (
                  <span className="text-xs text-gray-500">{t("tSet.upgradeHint")}</span>
                )}
              </div>
            </div>



            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresVatInvoices"
                checked={userProfile.requiresVatInvoices}
                onCheckedChange={(checked) => 
                  setUserProfile({...userProfile, requiresVatInvoices: !!checked})
                }
              />
              <Label htmlFor="requiresVatInvoices">{t("tSet.requiresVat")}</Label>
            </div>

            <Button onClick={() => updateProfile(userProfile)} disabled={isSaving}>
              {isSaving ? t("tSet.saving") : t("tSet.saveChanges")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stripe Account Status - hide for school members (non-owners) */}
      {userProfile && (!userProfile.isMemberOfSchool || userProfile.isSchoolOwner) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {t("tSet.stripeTitle")}
            </CardTitle>
            <CardDescription>
              {t("tSet.stripeDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("tSet.accountStatus")}: {userProfile.stripeAccountStatus}</p>
                <p className="text-sm text-muted-foreground">
                  {t("tSet.onboarding")}: {userProfile.stripeOnboardingComplete ? t("tSet.onboardingDone") : t("tSet.onboardingPending")}
                </p>
                {stripeConnectInfo?.stripeBusinessType && (
                  <p className="text-sm text-muted-foreground">
                    {t("tSet.stripeAccountType")}: {stripeConnectInfo.stripeBusinessType === 'company' ? t("tSet.company") : t("tSet.individual")}
                  </p>
                )}
              </div>
              {!userProfile.stripeOnboardingComplete && userProfile.stripeAccountStatus && (
                <Button asChild>
                  <a href="/api/stripe/create-account-link" target="_blank">
                    {t("tSet.finishSetup")}
                  </a>
                </Button>
              )}
            </div>

            {/* JDG/VAT invoices: recreate Stripe account as company */}
            {userProfile.isSchoolOwner &&
              userProfile.businessType === "individual" &&
              userProfile.requiresVatInvoices &&
              !!userProfile.taxId &&
              (stripeConnectInfo?.stripeBusinessType === 'individual' || stripeConnectInfo?.stripeBusinessType == null) && (
                <div className="mt-6 space-y-3 rounded-lg border p-4">
                  <p className="text-sm font-medium">
                    {t("tSet.vatJdgTitle")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("tSet.vatJdgDesc")}
                  </p>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="stripeRecreateConfirm"
                      checked={stripeRecreateConfirm}
                      onCheckedChange={(checked) => setStripeRecreateConfirm(!!checked)}
                    />
                    <Label htmlFor="stripeRecreateConfirm">
                      {t("tSet.stripeRecreateConfirm")}
                    </Label>
                  </div>

                  <Button
                    variant="destructive"
                    onClick={recreateStripeAccountAsCompany}
                    disabled={!stripeRecreateConfirm || isRecreatingStripe}
                  >
                    {isRecreatingStripe ? t("tSet.stripeRecreating") : t("tSet.stripeRecreateBtn")}
                  </Button>
                </div>
              )}
          </CardContent>
        </Card>
      )}

      {/* Platform Subscription Management - only the school owner can manage platform fees */}
      {userProfile?.isSchoolOwner && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t("tSet.platformSubTitle")}
          </CardTitle>
          <CardDescription>
            {t("tSet.platformSubDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {platformSubscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">
                    {t("tSet.plan")}: {platformSubscription.subscriptionType === 'individual' ? t("tSet.planIndividual") : t("tSet.planSchool")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("tSet.status")}: {platformSubscription.subscriptionStatus === 'active' ? t("tSet.statusActive") : 
                             platformSubscription.subscriptionStatus === 'cancel_at_period_end' ? t("tSet.statusCancelling") :
                             platformSubscription.subscriptionStatus || t("tSet.statusUnknown")}
                  </p>
                  {platformSubscription.currentPeriodEnd && (
                    <p className="text-sm text-muted-foreground">
                      {platformSubscription.subscriptionStatus === 'cancel_at_period_end' 
                        ? t("tSet.cancellation") 
                        : t("tSet.nextPayment")}
                      {new Date(platformSubscription.currentPeriodEnd).toLocaleDateString(locale === 'en' ? 'en-US' : 'pl-PL')}
                    </p>
                  )}
                  {platformSubscription.trialEnd && new Date(platformSubscription.trialEnd) > new Date() && (
                    <p className="text-sm text-green-600">
                      {t("tSet.trialUntil")}{new Date(platformSubscription.trialEnd).toLocaleDateString(locale === 'en' ? 'en-US' : 'pl-PL')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {platformSubscription.amount ? `${formatPln(calculateGrossPrice(platformSubscription.amount), locale)} ${platformSubscription.currency || 'PLN'}` : 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {platformSubscription.subscriptionType === 'individual' ? t("tSet.monthly") : t("tSet.yearly")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("tSet.grossAmount").replace("{percent}", (normalizeVatRate(platformSubscription.vatRate) * 100).toFixed(0))}
                  </p>
                </div>
              </div>
              
              {platformSubscription.subscriptionStatus === 'active' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("tSet.cancelPlatformSub")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("tSet.cancelPlatformConfirmTitle")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("tSet.cancelPlatformConfirmDesc")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("tSet.cancelBtn")}</AlertDialogCancel>
                      <AlertDialogAction onClick={cancelPlatformSubscription}>
                        {t("tSet.confirmCancel")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                {t("tSet.noActiveSub")}
              </p>
              <div className="space-y-4">
                {(
                  // Non-owners: allow Individual plan by businessType (or unset)
                  (!userProfile?.isSchoolOwner && (userProfile?.businessType === 'individual' || !userProfile?.businessType)) ||
                  // School owners: allow Individual plan by ownerSchoolType
                  (userProfile?.isSchoolOwner && userProfile?.ownerSchoolType === 'individual')
                ) && (
                  <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <h4 className="font-semibold">{t("tSet.planIndividualTitle")}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{t("tSet.upTo100")}</p>
                    <p className="text-2xl font-bold mb-1">{formatPln(19, locale)} {t("tSet.currency")}{" "}{t("tSet.grossLabel")} <span className="text-sm font-normal text-muted-foreground line-through">{formatPln(29, locale)} {t("tSet.currency")}</span><span className="text-sm font-normal">/{t("tSet.monthly")}</span></p>
                    <p className="text-xs text-muted-foreground mb-2">{formatPln(calculateNetPrice(19), locale)} {t("tSet.currency")} {t("tSet.netLabel")} + {t("tSet.vatLabel")} {PLATFORM_VAT_PERCENT}%</p>
                    <p className="text-xs text-green-600 mb-3">{t("tSet.freeMonths")}</p>
                    <Button onClick={() => subscribeToPlatform('individual')} className="w-full">
                      {t("tSet.choosePlan")}
                    </Button>
                  </div>
                )}
                {(
                  // Non-owners: allow School plan by businessType
                  (!userProfile?.isSchoolOwner && (userProfile?.businessType === 'company' || userProfile?.businessType === 'business')) ||
                  // School owners: allow School plan by ownerSchoolType
                  (userProfile?.isSchoolOwner && userProfile?.ownerSchoolType === 'business')
                ) && (
                  <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <h4 className="font-semibold">{t("tSet.planSchoolTitle")}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{t("tSet.over100")}</p>
                    <p className="text-2xl font-bold mb-1">{formatPln(1199, locale)} {t("tSet.currency")} {t("tSet.grossLabel")} <span className="text-sm font-normal text-muted-foreground line-through">{formatPln(1499, locale)} {t("tSet.currency")}</span><span className="text-sm font-normal">/{t("tSet.yearly")}</span></p>
                    <p className="text-xs text-muted-foreground mb-2">{formatPln(calculateNetPrice(1199), locale)} {t("tSet.currency")} {t("tSet.netLabel")} + {t("tSet.vatLabel")} {PLATFORM_VAT_PERCENT}%</p>
                    <p className="text-xs text-green-600 mb-3">{t("tSet.freeMonths")}</p>
                    <Button onClick={() => subscribeToPlatform('school')} className="w-full">
                      {t("tSet.choosePlan")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* School Membership Info - show for school members who are not owners */}
      {userProfile?.isMemberOfSchool && !userProfile?.isSchoolOwner && userProfile?.memberSchool && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {t("tSet.schoolSubTitle")}
          </CardTitle>
          <CardDescription>
            {t("tSet.schoolSubDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {platformSubscription && (platformSubscription.subscriptionStatus === 'active' || platformSubscription.subscriptionStatus === 'cancel_at_period_end') ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                <div>
                  <p className="font-medium text-blue-900">{t("tSet.schoolMember")}</p>
                  <p className="text-sm text-blue-700 mt-1">{userProfile.memberSchool.name}</p>
                  <p className="text-xs text-blue-600 mt-2">{t("tSet.schoolPays")}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">
                    {t("tSet.plan")}: {platformSubscription.subscriptionType === 'individual' ? t("tSet.planIndividual") : t("tSet.planSchool")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("tSet.status")}: {platformSubscription.subscriptionStatus === 'active' ? t("tSet.statusActive") : 
                             platformSubscription.subscriptionStatus === 'cancel_at_period_end' ? t("tSet.statusCancelling") :
                             platformSubscription.subscriptionStatus || t("tSet.statusUnknown")}
                  </p>
                  {platformSubscription.currentPeriodEnd && (
                    <p className="text-sm text-muted-foreground">
                      {platformSubscription.subscriptionStatus === 'cancel_at_period_end' 
                        ? t("tSet.cancellation") 
                        : t("tSet.nextPayment")}
                      {new Date(platformSubscription.currentPeriodEnd).toLocaleDateString(locale === 'en' ? 'en-US' : 'pl-PL')}
                    </p>
                  )}
                  {platformSubscription.trialEnd && new Date(platformSubscription.trialEnd) > new Date() && (
                    <p className="text-sm text-green-600">
                      {t("tSet.trialUntil")}{new Date(platformSubscription.trialEnd).toLocaleDateString(locale === 'en' ? 'en-US' : 'pl-PL')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {platformSubscription.amount ? `${formatPln(calculateGrossPrice(platformSubscription.amount), locale)} ${platformSubscription.currency || 'PLN'}` : 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {platformSubscription.subscriptionType === 'individual' ? t("tSet.monthly") : t("tSet.yearly")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("tSet.grossAmount").replace("{percent}", (normalizeVatRate(platformSubscription.vatRate) * 100).toFixed(0))}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                <div>
                  <p className="font-medium text-blue-900">{t("tSet.schoolMember")}</p>
                  <p className="text-sm text-blue-700 mt-1">{userProfile.memberSchool.name}</p>
                  <p className="text-xs text-blue-600 mt-2">{t("tSet.schoolNoSub")}</p>
                </div>
              </div>
              <p className="text-muted-foreground text-center">
                {t("tSet.askOwner")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default TeacherSettingsPage;