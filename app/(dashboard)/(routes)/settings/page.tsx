"use client";

import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Trash2, CreditCard, Settings } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

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
  const { t, locale } = useI18n();
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
      toast.error(t('settings.loadError'));
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
        toast.success(t('settings.courseCancelSuccess'));
        fetchSubscriptions(); // Refresh the list
      } else {
        toast.error(t('settings.courseCancelError'));
      }
    } catch (error) {
      console.error('Error cancelling course subscription:', error);
      toast.error(t('settings.courseCancelError'));
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
        toast.success(t('settings.pathCancelSuccess'));
        fetchSubscriptions(); // Refresh the list
      } else {
        toast.error(t('settings.pathCancelError'));
      }
    } catch (error) {
      console.error('Error cancelling educational path subscription:', error);
      toast.error(t('settings.pathCancelError'));
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
            <span>{t('settings.title')}</span>
          </h1>
          <p className="text-gray-600 mt-2">
            {t('settings.subtitle')}
          </p>
        </div>
      </div>

      {/* Course Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange-600" />
            {t('settings.purchasedCourses')}
          </CardTitle>
          <CardDescription>
            {t('settings.purchasedCoursesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userCourses.length === 0 ? (
            <p className="text-muted-foreground">{t('settings.noPurchasedCourses')}</p>
          ) : (
            <div className="space-y-4">
              {userCourses.map((userCourse) => (
                <div key={userCourse.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{userCourse.course.title}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {userCourse.purchase ? (
                        <>
                          <p>{t('settings.type')} {userCourse.purchase.isRecurring ? t('settings.subscription') : t('settings.oneTimePurchase')}</p>
                          <p>{t('settings.paymentStatus')} {userCourse.purchase.subscriptionStatus || 'N/A'}</p>
                          <p>{t('settings.subscriptionId')} {userCourse.purchase.subscriptionId || t('settings.none')}</p>
                          {userCourse.purchase.currentPeriodEnd && (
                            <p>
                              {userCourse.purchase.subscriptionStatus === 'cancel_at_period_end' ? t('settings.cancellation') + ' ' : t('settings.renewal') + ' '}
                              {new Date(userCourse.purchase.currentPeriodEnd).toLocaleDateString(locale === 'en' ? 'en-US' : 'pl-PL')}
                            </p>
                          )}
                          {userCourse.purchase.amount && (
                            <p>{t('settings.amount')} {userCourse.purchase.amount} {userCourse.purchase.currency}</p>
                          )}
                        </>
                      ) : (
                        <p>{t('settings.noPurchaseData')}</p>
                      )}
                    </div>
                  </div>
                  {/* Show cancel button only for active subscriptions that are not already cancelled */}
                  {userCourse.purchase?.subscriptionId && !['canceled', 'cancel_at_period_end'].includes(userCourse.purchase?.subscriptionStatus || '') ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('settings.cancelSubscription')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('settings.cancelSubscriptionTitle')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('settings.cancelCourseDesc').replace('{title}', userCourse.course.title)}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('settings.keepSubscription')}</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => cancelCourseSubscription(userCourse.id, userCourse.purchase?.subscriptionId)}
                            className="bg-red-600 text-white hover:bg-red-700"
                          >
                            {t('settings.cancelSubscription')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <div className="text-sm text-muted-foreground px-3 py-2 bg-gray-50 rounded">
                      {userCourse.purchase?.subscriptionStatus === 'canceled' ? t('settings.subscriptionCanceled') :
                       userCourse.purchase?.subscriptionStatus === 'cancel_at_period_end' ? t('settings.cancellationScheduled') :
                       !userCourse.purchase?.subscriptionId ? t('settings.oneTimePurchase') : t('settings.inactiveSubscription')}
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
            {t('settings.purchasedPaths')}
          </CardTitle>
          <CardDescription>
            {t('settings.purchasedPathsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {educationalPathPurchases.length === 0 ? (
            <p className="text-muted-foreground">{t('settings.noPurchasedPaths')}</p>
          ) : (
            <div className="space-y-4">
              {educationalPathPurchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{purchase.educationalPath.title}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{t('settings.type')} {purchase.isRecurring ? t('settings.subscription') : t('settings.oneTimePurchase')}</p>
                      <p>{t('settings.paymentStatus')} {purchase.subscriptionStatus || 'N/A'}</p>
                      <p>{t('settings.subscriptionId')} {purchase.subscriptionId || t('settings.none')}</p>
                      {purchase.currentPeriodEnd && (
                        <p>
                          {purchase.subscriptionStatus === 'cancel_at_period_end' ? t('settings.cancellation') + ' ' : t('settings.renewal') + ' '}
                          {new Date(purchase.currentPeriodEnd).toLocaleDateString(locale === 'en' ? 'en-US' : 'pl-PL')}
                        </p>
                      )}
                      {purchase.amount && (
                        <p>{t('settings.amount')} {purchase.amount} {purchase.currency}</p>
                      )}
                    </div>
                  </div>
                  {/* Show cancel button only for active subscriptions that are not already cancelled */}
                  {purchase.subscriptionId && !['canceled', 'cancel_at_period_end'].includes(purchase.subscriptionStatus || '') ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('settings.cancelSubscription')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('settings.cancelSubscriptionTitle')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('settings.cancelPathDesc').replace('{title}', purchase.educationalPath.title)}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('settings.keepSubscription')}</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => cancelEducationalPathSubscription(purchase.id, purchase.subscriptionId)}
                            className="bg-red-600 text-white hover:bg-red-700"
                          >
                            {t('settings.cancelSubscription')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <div className="text-sm text-muted-foreground px-3 py-2 bg-gray-50 rounded">
                      {purchase.subscriptionStatus === 'canceled' ? t('settings.subscriptionCanceled') :
                       purchase.subscriptionStatus === 'cancel_at_period_end' ? t('settings.cancellationScheduled') :
                       !purchase.subscriptionId ? t('settings.oneTimePurchase') : t('settings.inactiveSubscription')}
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