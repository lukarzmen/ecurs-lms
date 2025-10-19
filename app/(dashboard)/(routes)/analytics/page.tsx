"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { 
  Bar, 
  Doughnut, 
  Line,
  PolarArea 
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  RadialLinearScale,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Trophy, 
  Target, 
  Flame, 
  Calendar,
  Clock,
  TrendingUp,
  Award,
  Star,
  CheckCircle2
} from "lucide-react";

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  PointElement,
  LineElement,
  RadialLinearScale,
  Tooltip, 
  Legend
);

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  category: string;
}

interface CourseProgress {
  id: number;
  title: string;
  description: string | null;
  totalModules: number;
  completedModules: number;
  progressPercentage: number;
  nextModule: {
    id: number;
    title: string;
    position: number;
  } | null;
  isCompleted: boolean;
  enrolledAt: string;
}

interface PathProgress {
  id: number;
  title: string;
  description: string | null;
  totalCourses: number;
  totalModules: number;
  completedModules: number;
  progressPercentage: number;
  isCompleted: boolean;
  enrolledAt: string;
}

interface RecentCompletion {
  id: number;
  moduleTitle: string;
  courseTitle: string;
  completedAt: string;
}

interface StudentAnalyticsData {
  enrolledCoursesCount: number;
  completedCoursesCount: number;
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  overallProgress: number;
  currentStreak: number;
  thisWeekActivity: number;
  thisMonthActivity: number;
  courseProgress: CourseProgress[];
  pathProgress: PathProgress[];
  recentCompletions: RecentCompletion[];
  achievements: Achievement[];
  userInfo: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    memberSince: string;
  };
}

const StudentAnalyticsPage = () => {
  const [analyticsData, setAnalyticsData] = useState<StudentAnalyticsData>({
    enrolledCoursesCount: 0,
    completedCoursesCount: 0,
    totalModules: 0,
    completedModules: 0,
    inProgressModules: 0,
    overallProgress: 0,
    currentStreak: 0,
    thisWeekActivity: 0,
    thisMonthActivity: 0,
    courseProgress: [],
    pathProgress: [],
    recentCompletions: [],
    achievements: [],
    userInfo: {
      firstName: null,
      lastName: null,
      email: "",
      memberSince: ""
    }
  });
  
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (userId) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/student-analytics?userId=${userId}`,
            { cache: "no-store" }
          );
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data: StudentAnalyticsData = await response.json();
          setAnalyticsData(data);
        } catch (error) {
          console.error("Error fetching student analytics:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const {
    enrolledCoursesCount,
    completedCoursesCount,
    totalModules,
    completedModules,
    inProgressModules,
    overallProgress,
    currentStreak,
    thisWeekActivity,
    thisMonthActivity,
    courseProgress,
    pathProgress,
    recentCompletions,
    achievements,
    userInfo
  } = analyticsData;

  // Chart data for overall progress
  const progressData = {
    labels: ["Ukończone", "W trakcie", "Pozostałe"],
    datasets: [
      {
        data: [
          completedModules,
          inProgressModules,
          totalModules - completedModules - inProgressModules
        ],
        backgroundColor: ["#22c55e", "#f59e0b", "#e5e7eb"],
        borderWidth: 2,
      },
    ],
  };

  // Weekly activity chart
  const activityData = {
    labels: ["Ten tydzień", "Ten miesiąc"],
    datasets: [
      {
        label: "Ukończone moduły",
        data: [thisWeekActivity, thisMonthActivity],
        backgroundColor: ["#3b82f6", "#8b5cf6"],
        borderRadius: 8,
      },
    ],
  };

  // Course progress chart
  const courseProgressData = {
    labels: courseProgress.slice(0, 5).map(course => course.title.length > 20 ? 
      course.title.substring(0, 20) + "..." : course.title),
    datasets: [
      {
        label: "Postęp (%)",
        data: courseProgress.slice(0, 5).map(course => course.progressPercentage),
        backgroundColor: "#3b82f6",
        borderRadius: 8,
      },
    ],
  };

  const welcomeName = userInfo.firstName || userInfo.email.split('@')[0];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            👋 Witaj, {welcomeName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Oto Twój postęp w nauce. Świetna robota!
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Flame className="h-6 w-6 text-orange-500" />
          <span className="text-2xl font-bold text-orange-600">{currentStreak}</span>
          <span className="text-gray-600">dni z rzędu</span>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Zapisane kursy
            </CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{enrolledCoursesCount}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ukończone kursy
            </CardTitle>
            <Trophy className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCoursesCount}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ogólny postęp
            </CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{overallProgress}%</div>
            <Progress value={overallProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Osiągnięcia
            </CardTitle>
            <Award className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{achievements.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Postęp modułów</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-64 h-64">
              <Doughnut 
                data={progressData} 
                options={{
                  plugins: { 
                    legend: { position: "bottom" },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const label = context.label || '';
                          const value = context.parsed;
                          return `${label}: ${value} modułów`;
                        }
                      }
                    }
                  },
                  maintainAspectRatio: false
                }} 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Aktywność</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Bar 
              data={activityData} 
              options={{
                plugins: { legend: { display: false } },
                scales: { 
                  y: { 
                    beginAtZero: true, 
                    ticks: { stepSize: 1 } 
                  } 
                }
              }} 
            />
          </CardContent>
        </Card>
      </div>

      {/* Current Courses Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Postęp w kursach</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {courseProgress.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nie jesteś zapisany na żadne kursy</p>
              <p className="text-sm">Rozpocznij swoją przygodę z nauką!</p>
            </div>
          ) : (
            courseProgress.map((course) => (
              <div key={course.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{course.title}</h3>
                    <p className="text-gray-600 text-sm">{course.description}</p>
                  </div>
                  {course.isCompleted && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Ukończono
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{course.completedModules}/{course.totalModules} modułów</span>
                  <span className="font-semibold">{course.progressPercentage}%</span>
                </div>
                
                <Progress value={course.progressPercentage} className="h-2" />
                
                {course.nextModule && !course.isCompleted && (
                  <div className="bg-blue-50 p-3 rounded border-l-4 border-l-blue-500">
                    <p className="text-sm font-medium text-blue-800">
                      Następny moduł: {course.nextModule.title}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Educational Paths Progress */}
      {pathProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Ścieżki edukacyjne</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pathProgress.map((path) => (
              <div key={path.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{path.title}</h3>
                    <p className="text-gray-600 text-sm">{path.description}</p>
                  </div>
                  {path.isCompleted && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Ukończono
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{path.completedModules}/{path.totalModules} modułów z {path.totalCourses} kursów</span>
                  <span className="font-semibold">{path.progressPercentage}%</span>
                </div>
                
                <Progress value={path.progressPercentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Osiągnięcia</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {achievements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Jeszcze nie masz osiągnięć</p>
              <p className="text-sm">Rozpocznij naukę, aby zdobyć pierwsze!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold">{achievement.title}</h4>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {new Date(achievement.unlockedAt).toLocaleDateString('pl-PL')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Ostatnia aktywność</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentCompletions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Brak ostatniej aktywności</p>
              <p className="text-sm">Ukończ moduł, aby zobaczyć postęp!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCompletions.slice(0, 5).map((completion) => (
                <div key={completion.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="font-medium">{completion.moduleTitle}</p>
                    <p className="text-sm text-gray-600">{completion.courseTitle}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(completion.completedAt).toLocaleDateString('pl-PL')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Motivational Footer */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <Star className="h-8 w-8 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-xl font-semibold mb-2">Świetna robota!</h3>
          <p className="text-gray-600 mb-4">
            {overallProgress > 75 
              ? "Jesteś już blisko końca! Nie poddawaj się teraz!" 
              : overallProgress > 50 
              ? "Ponad połowa drogi za Tobą. Trzymaj tempo!" 
              : overallProgress > 25 
              ? "Dobry początek! Każdy krok przybliża Cię do celu."
              : "Każda wielka podróż zaczyna się od pierwszego kroku. Trzymaj się!"}
          </p>
          <div className="text-sm text-gray-500">
            Uczysz się od {new Date(userInfo.memberSince).toLocaleDateString('pl-PL')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAnalyticsPage;