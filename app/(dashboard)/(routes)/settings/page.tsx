"use client";

import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Trash2, CreditCard, Settings } from "lucide-react";

interface UserCourse {
  id: number;
  course: {
    id: number;
    title: string;
  };
  purchase?: {
    id: number;
    subscriptionId?: string;
    isRecurring: boolean;
    subscriptionStatus?: string;
    currentPeriodEnd?: string;
    amount?: number;
    currency?: string;
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
  amount?: number;
  currency?: string;
}

const SettingsPage = () => {
  const { userId, sessionId } = useAuth();
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [educationalPathPurchases, setEducationalPathPurchases] = useState<EducationalPathPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user courses with subscriptions
      const coursesResponse = await fetch('/api/student/courses');
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        console.log('Raw courses data:', coursesData);
        
        // Show all courses with any purchase data (for debugging)
        const filteredCourses = coursesData.filter((course: UserCourse) => 
          course.purchase != null
        );
        console.log('Filtered courses:', filteredCourses);
        setUserCourses(filteredCourses);
      }

      // Fetch educational path purchases with subscriptions
      const pathsResponse = await fetch('/api/student/educational-paths');
      if (pathsResponse.ok) {
        const pathsData = await pathsResponse.json();
        console.log('Raw educational paths data:', pathsData);
        
        // Show all educational path purchases (for debugging)
        console.log('All educational path purchases:', pathsData);
        setEducationalPathPurchases(pathsData);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Błąd podczas ładowania subskrypcji');
    } finally {
      setIsLoading(false);
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
        toast.success('Subskrypcja kursu zostanie anulowana na koniec okresu rozliczeniowego');
        fetchSubscriptions(); // Refresh the list
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
        toast.success('Subskrypcja ścieżki edukacyjnej zostanie anulowana na koniec okresu rozliczeniowego');
        fetchSubscriptions(); // Refresh the list
      } else {
        toast.error('Błąd podczas anulowania subskrypcji ścieżki edukacyjnej');
      }
    } catch (error) {
      console.error('Error cancelling educational path subscription:', error);
      toast.error('Błąd podczas anulowania subskrypcji ścieżki edukacyjnej');
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-orange-600" />
            <span>Ustawienia</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Zarządzaj swoimi subskrypcjami i ustawieniami konta
          </p>
        </div>
      </div>

      {/* Course Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange-600" />
            Zakupione kursy
          </CardTitle>
          <CardDescription>
            Przegląd wszystkich zakupionych kursów i aktywnych subskrypcji
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userCourses.length === 0 ? (
            <p className="text-muted-foreground">Nie masz zakupionych kursów</p>
          ) : (
            <div className="space-y-4">
              {userCourses.map((userCourse) => (
                <div key={userCourse.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{userCourse.course.title}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {userCourse.purchase ? (
                        <>
                          <p>Typ: {userCourse.purchase.isRecurring ? 'Subskrypcja' : 'Jednorazowy zakup'}</p>
                          <p>Status płatności: {userCourse.purchase.subscriptionStatus || 'N/A'}</p>
                          <p>ID subskrypcji: {userCourse.purchase.subscriptionId || 'Brak'}</p>
                          {userCourse.purchase.currentPeriodEnd && (
                            <p>
                              {userCourse.purchase.subscriptionStatus === 'cancel_at_period_end' ? 'Anulowanie: ' : 'Odnowienie: '}
                              {new Date(userCourse.purchase.currentPeriodEnd).toLocaleDateString('pl-PL')}
                            </p>
                          )}
                          {userCourse.purchase.amount && (
                            <p>Kwota: {userCourse.purchase.amount} {userCourse.purchase.currency}</p>
                          )}
                        </>
                      ) : (
                        <p>Brak danych o zakupie</p>
                      )}
                    </div>
                  </div>
                  {/* Show cancel button only for active subscriptions that are not already cancelled */}
                  {userCourse.purchase?.subscriptionId && !['canceled', 'cancel_at_period_end'].includes(userCourse.purchase?.subscriptionStatus || '') ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Anuluj subskrypcję
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Anulować subskrypcję?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Czy na pewno chcesz anulować subskrypcję kursu &quot;{userCourse.course.title}&quot;? 
                            Ta akcja jest nieodwracalna i stracisz dostęp do kursu po zakończeniu bieżącego okresu rozliczeniowego.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Anuluj</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => cancelCourseSubscription(userCourse.id, userCourse.purchase?.subscriptionId)}
                            className="bg-red-600 text-white hover:bg-red-700"
                          >
                            Anuluj subskrypcję
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <div className="text-sm text-muted-foreground px-3 py-2 bg-gray-50 rounded">
                      {userCourse.purchase?.subscriptionStatus === 'canceled' ? 'Subskrypcja anulowana' :
                       userCourse.purchase?.subscriptionStatus === 'cancel_at_period_end' ? 'Anulowanie zaplanowane' :
                       !userCourse.purchase?.subscriptionId ? 'Jednorazowy zakup' : 'Nieaktywna subskrypcja'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Educational Path Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange-600" />
            Zakupione ścieżki edukacyjne
          </CardTitle>
          <CardDescription>
            Przegląd wszystkich zakupionych ścieżek edukacyjnych i aktywnych subskrypcji
          </CardDescription>
        </CardHeader>
        <CardContent>
          {educationalPathPurchases.length === 0 ? (
            <p className="text-muted-foreground">Nie masz zakupionych ścieżek edukacyjnych</p>
          ) : (
            <div className="space-y-4">
              {educationalPathPurchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{purchase.educationalPath.title}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Typ: {purchase.isRecurring ? 'Subskrypcja' : 'Jednorazowy zakup'}</p>
                      <p>Status płatności: {purchase.subscriptionStatus || 'N/A'}</p>
                      <p>ID subskrypcji: {purchase.subscriptionId || 'Brak'}</p>
                      {purchase.currentPeriodEnd && (
                        <p>
                          {purchase.subscriptionStatus === 'cancel_at_period_end' ? 'Anulowanie: ' : 'Odnowienie: '}
                          {new Date(purchase.currentPeriodEnd).toLocaleDateString('pl-PL')}
                        </p>
                      )}
                      {purchase.amount && (
                        <p>Kwota: {purchase.amount} {purchase.currency}</p>
                      )}
                    </div>
                  </div>
                  {/* Show cancel button only for active subscriptions that are not already cancelled */}
                  {purchase.subscriptionId && !['canceled', 'cancel_at_period_end'].includes(purchase.subscriptionStatus || '') ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Anuluj subskrypcję
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Anulować subskrypcję?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Czy na pewno chcesz anulować subskrypcję ścieżki edukacyjnej &quot;{purchase.educationalPath.title}&quot;? 
                            Ta akcja jest nieodwracalna i stracisz dostęp do ścieżki po zakończeniu bieżącego okresu rozliczeniowego.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Anuluj</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => cancelEducationalPathSubscription(purchase.id, purchase.subscriptionId)}
                            className="bg-red-600 text-white hover:bg-red-700"
                          >
                            Anuluj subskrypcję
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <div className="text-sm text-muted-foreground px-3 py-2 bg-gray-50 rounded">
                      {purchase.subscriptionStatus === 'canceled' ? 'Subskrypcja anulowana' :
                       purchase.subscriptionStatus === 'cancel_at_period_end' ? 'Anulowanie zaplanowane' :
                       !purchase.subscriptionId ? 'Jednorazowy zakup' : 'Nieaktywna subskrypcja'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;