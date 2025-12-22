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
  currency?: string;
  trialEnd?: string;
}

const TeacherSettingsPage = () => {
  const { userId, sessionId } = useAuth();
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [educationalPathPurchases, setEducationalPathPurchases] = useState<EducationalPathPurchase[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [platformSubscription, setPlatformSubscription] = useState<PlatformSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

      // Fetch user courses with subscriptions
      const coursesResponse = await fetch('/api/student/courses');
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setUserCourses(coursesData.filter((course: UserCourse) => 
          course.purchase?.isRecurring && course.purchase?.subscriptionStatus === 'active'
        ));
      }

      // Fetch educational path purchases with subscriptions
      const pathsResponse = await fetch('/api/student/educational-paths');
      if (pathsResponse.ok) {
        const pathsData = await pathsResponse.json();
        setEducationalPathPurchases(pathsData.filter((purchase: EducationalPathPurchase) => 
          purchase.isRecurring && purchase.subscriptionStatus === 'active'
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
      toast.error('Błąd podczas ładowania danych');
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
        toast.success('Profil został zaktualizowany');
      } else {
        toast.error('Błąd podczas aktualizacji profilu');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Błąd podczas aktualizacji profilu');
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
        toast.success('Subskrypcja kursu została anulowana');
        fetchData(); // Refresh the data
      } else {
        toast.error('Błąd podczas anulowania subskrypcji kursu');
      }
    } catch (error) {
      console.error('Error cancelling course subscription:', error);
      toast.error('Błąd podczas anulowania subskrypcji kursu');
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
        toast.success('Subskrypcja ścieżki edukacyjnej została anulowana');
        fetchData(); // Refresh the data
      } else {
        toast.error('Błąd podczas anulowania subskrypcji ścieżki edukacyjnej');
      }
    } catch (error) {
      console.error('Error cancelling educational path subscription:', error);
      toast.error('Błąd podczas anulowania subskrypcji ścieżki edukacyjnej');
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
        toast.error('Błąd podczas tworzenia subskrypcji platformy');
      }
    } catch (error) {
      console.error('Error creating platform subscription:', error);
      toast.error('Błąd podczas tworzenia subskrypcji platformy');
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
        toast.success('Subskrypcja platformy zostanie anulowana na koniec okresu rozliczeniowego');
        fetchData(); // Refresh the data
      } else {
        toast.error('Błąd podczas anulowania subskrypcji platformy');
      }
    } catch (error) {
      console.error('Error cancelling platform subscription:', error);
      toast.error('Błąd podczas anulowania subskrypcji platformy');
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
        <h1 className="text-2xl font-bold">⚙️ Ustawienia nauczyciela</h1>
        <p className="text-muted-foreground">Zarządzaj swoimi ustawieniami konta, subskrypcjami i preferencjami</p>
      </div>



      {/* Profile Settings */}
      {userProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profil użytkownika
            </CardTitle>
            <CardDescription>
              Zarządzaj swoimi danymi osobowymi i ustawieniami konta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Imię</Label>
                <Input
                  id="firstName"
                  value={userProfile.firstName || ''}
                  onChange={(e) => setUserProfile({...userProfile, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nazwisko</Label>
                <Input
                  id="lastName"
                  value={userProfile.lastName || ''}
                  onChange={(e) => setUserProfile({...userProfile, lastName: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="displayName">Nazwa wyświetlana</Label>
              <Input
                id="displayName"
                value={userProfile.displayName || ''}
                onChange={(e) => setUserProfile({...userProfile, displayName: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="businessType">Typ działalności</Label>
              <div className="p-2 border rounded-md bg-gray-50 flex items-center justify-between">
                <span className="text-sm">
                  {userProfile.businessType === 'individual' ? 'Osoba fizyczna' : 'Firma'}
                </span>
                {userProfile.businessType === 'individual' && (
                  <span className="text-xs text-gray-500">Upgrade w sekcji powyżej</span>
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
              <Label htmlFor="requiresVatInvoices">Wymaga faktur VAT</Label>
            </div>

            <Button onClick={() => updateProfile(userProfile)} disabled={isSaving}>
              {isSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}
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
              Status konta Stripe
            </CardTitle>
            <CardDescription>
              Status Twojego konta płatniczego
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Status konta: {userProfile.stripeAccountStatus}</p>
                <p className="text-sm text-muted-foreground">
                  Onboarding: {userProfile.stripeOnboardingComplete ? 'Zakończony' : 'W trakcie'}
                </p>
              </div>
              {!userProfile.stripeOnboardingComplete && userProfile.stripeAccountStatus && (
                <Button asChild>
                  <a href="/api/stripe/create-account-link" target="_blank">
                    Dokończ konfigurację
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Subscription Management - hide for school members (non-owners) */}
      {(!userProfile?.isMemberOfSchool || userProfile?.isSchoolOwner) && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subskrypcja platformy
          </CardTitle>
          <CardDescription>
            Zarządzaj dostępem do platformy Ecurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {platformSubscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">
                    Plan: {platformSubscription.subscriptionType === 'individual' ? 'Indywidualny' : 'Szkolny'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Status: {platformSubscription.subscriptionStatus === 'active' ? 'Aktywny' : 
                             platformSubscription.subscriptionStatus === 'cancel_at_period_end' ? 'Zostanie anulowany' :
                             platformSubscription.subscriptionStatus || 'Nieznany'}
                  </p>
                  {platformSubscription.currentPeriodEnd && (
                    <p className="text-sm text-muted-foreground">
                      {platformSubscription.subscriptionStatus === 'cancel_at_period_end' 
                        ? 'Anulowanie: ' 
                        : 'Następna płatność: '}
                      {new Date(platformSubscription.currentPeriodEnd).toLocaleDateString('pl-PL')}
                    </p>
                  )}
                  {platformSubscription.trialEnd && new Date(platformSubscription.trialEnd) > new Date() && (
                    <p className="text-sm text-green-600">
                      Okres próbny do: {new Date(platformSubscription.trialEnd).toLocaleDateString('pl-PL')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {platformSubscription.amount ? `${platformSubscription.amount} ${platformSubscription.currency || 'PLN'}` : 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {platformSubscription.subscriptionType === 'individual' ? 'miesięcznie' : 'rocznie'}
                  </p>
                </div>
              </div>
              
              {platformSubscription.subscriptionStatus === 'active' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Anuluj subskrypcję platformy
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Czy na pewno chcesz anulować subskrypcję platformy?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Subskrypcja zostanie anulowana na koniec bieżącego okresu rozliczeniowego. 
                        Do tego czasu zachowasz dostęp do wszystkich funkcji platformy.
                        Po anulowaniu nie będziesz mógł tworzyć nowych kursów ani zarządzać istniejącymi.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Anuluj</AlertDialogCancel>
                      <AlertDialogAction onClick={cancelPlatformSubscription}>
                        Potwierdź anulowanie
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Nie masz aktywnej subskrypcji platformy. Wybierz plan aby uzyskać pełny dostęp do funkcji nauczycielskich.
              </p>
              <div className="space-y-4">
                {(userProfile?.businessType === 'individual' || !userProfile?.businessType) && !userProfile?.isSchoolOwner && (
                  <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <h4 className="font-semibold">Plan Indywidualny</h4>
                    <p className="text-sm text-muted-foreground mb-2">Do 20 uczniów</p>
                    <p className="text-2xl font-bold mb-2">39 zł<span className="text-sm font-normal">/miesiąc</span></p>
                    <p className="text-xs text-green-600 mb-3">30 dni gratis</p>
                    <Button onClick={() => subscribeToPlatform('individual')} className="w-full">
                      Wybierz plan
                    </Button>
                  </div>
                )}
                {((userProfile?.businessType === 'company' || userProfile?.businessType === 'business' || userProfile?.ownerSchoolType === 'business')) && (
                  <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <h4 className="font-semibold">Plan Szkolny</h4>
                    <p className="text-sm text-muted-foreground mb-2">Powyżej 20 uczniów</p>
                    <p className="text-2xl font-bold mb-2">1499 zł<span className="text-sm font-normal">/rok</span></p>
                    <p className="text-xs text-green-600 mb-3">30 dni gratis</p>
                    <Button onClick={() => subscribeToPlatform('school')} className="w-full">
                      Wybierz plan
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
            Subskrypcja szkoły
          </CardTitle>
          <CardDescription>
            Dostęp do platformy opłacany przez szkołę
          </CardDescription>
        </CardHeader>
        <CardContent>
          {platformSubscription && platformSubscription.subscriptionStatus === 'active' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                <div>
                  <p className="font-medium text-blue-900">Jesteś członkiem szkoły</p>
                  <p className="text-sm text-blue-700 mt-1">{userProfile.memberSchool.name}</p>
                  <p className="text-xs text-blue-600 mt-2">Subskrypcja platformy jest opłacana przez Twoją szkołę. Nie musisz płacić osobno.</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">
                    Plan: {platformSubscription.subscriptionType === 'individual' ? 'Indywidualny' : 'Szkolny'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Status: {platformSubscription.subscriptionStatus === 'active' ? 'Aktywny' : 
                             platformSubscription.subscriptionStatus === 'cancel_at_period_end' ? 'Zostanie anulowany' :
                             platformSubscription.subscriptionStatus || 'Nieznany'}
                  </p>
                  {platformSubscription.currentPeriodEnd && (
                    <p className="text-sm text-muted-foreground">
                      {platformSubscription.subscriptionStatus === 'cancel_at_period_end' 
                        ? 'Anulowanie: ' 
                        : 'Następna płatność: '}
                      {new Date(platformSubscription.currentPeriodEnd).toLocaleDateString('pl-PL')}
                    </p>
                  )}
                  {platformSubscription.trialEnd && new Date(platformSubscription.trialEnd) > new Date() && (
                    <p className="text-sm text-green-600">
                      Okres próbny do: {new Date(platformSubscription.trialEnd).toLocaleDateString('pl-PL')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {platformSubscription.amount ? `${platformSubscription.amount} ${platformSubscription.currency || 'PLN'}` : 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {platformSubscription.subscriptionType === 'individual' ? 'miesięcznie' : 'rocznie'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                <div>
                  <p className="font-medium text-blue-900">Jesteś członkiem szkoły</p>
                  <p className="text-sm text-blue-700 mt-1">{userProfile.memberSchool.name}</p>
                  <p className="text-xs text-blue-600 mt-2">Szkoła nie ma jeszcze aktywnej subskrypcji platformy.</p>
                </div>
              </div>
              <p className="text-muted-foreground text-center">
                Poproś właściciela szkoły, aby skonfigurował subskrypcję platformy.
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