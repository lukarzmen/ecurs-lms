"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  BookOpen, 
  GraduationCap,
  TrendingUp,
  Award,
  Target,
  Calendar,
  Star,
  UserCheck,
  UserPlus,
  BarChart3,
  Activity,
  Trophy
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

interface CourseDetail {
  id: string;
  title: string;
  usersCount: number;
  modulesCount: number;
  averageCompletionRate: string;
  mostActiveUser: string;
  lastActiveUser: string;
  lastActiveDate?: string;
}

interface AnalyticsData {
  userCount: number;
  coursesCount: number;
  modulesCount: number;
  averageCompletionRate: string;
  activeUserCount: number;
  returningUsersCount: number;
  mostPopularCourse?: string;
  newUsersLastMonth?: number;
  newCoursesLastMonth?: number;
  leastPopularCourse?: string;
  leastActiveStudent?: string;
  mostActiveStudent?: string;
  mostCoursesStudent?: string;
  coursesDetails?: CourseDetail[];
  // Educational Path Analytics
  pathUserCount?: number;
  pathsCount?: number;
  pathCoursesCount?: number;
  averagePathCompletionRate?: string;
  mostPopularPath?: string;
  leastPopularPath?: string;
  newPathUsersLastMonth?: number;
  newPathsLastMonth?: number;
  pathsDetails?: { id: string; title: string; usersCount: number; coursesCount: number; averageCompletionRate: string; }[];
}

const AnalyticsPage = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    userCount: 0,
    coursesCount: 0,
    modulesCount: 0,
    averageCompletionRate: "0%",
    activeUserCount: 0,
    returningUsersCount: 0,
    mostPopularCourse: "???",
    newUsersLastMonth: 0,
    newCoursesLastMonth: 0,
    leastPopularCourse: "???",
    leastActiveStudent: "???",
    mostActiveStudent: "???",
    mostCoursesStudent: "???",
    coursesDetails: [],
    pathUserCount: 0,
    pathsCount: 0,
    pathCoursesCount: 0,
    averagePathCompletionRate: "0%",
    mostPopularPath: "???",
    leastPopularPath: "???",
    newPathUsersLastMonth: 0,
    newPathsLastMonth: 0,
    pathsDetails: [],
  });
  
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (userId) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/analytics?userId=${userId}`,
            { cache: "no-store" }
          );
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data: AnalyticsData = await response.json();
          setAnalyticsData(data);
        } catch (error) {
          console.error("Error fetching analytics:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-8">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const {
    userCount,
    coursesCount,
    modulesCount,
    averageCompletionRate,
    activeUserCount,
    returningUsersCount,
    mostPopularCourse,
    newUsersLastMonth,
    newCoursesLastMonth,
    leastPopularCourse,
    leastActiveStudent,
    mostActiveStudent,
    mostCoursesStudent,
    coursesDetails = [],
    pathUserCount,
    pathsCount,
    pathCoursesCount,
    averagePathCompletionRate,
    mostPopularPath,
    leastPopularPath,
    newPathUsersLastMonth,
    newPathsLastMonth,
    pathsDetails = [],
  } = analyticsData;

  // Chart data
  const barData = {
    labels: [
      "Wszyscy kursanci",
      "Aktywni (7 dni)",
      "Powracający",
      "Nowi (miesiąc)",
    ],
    datasets: [
      {
        label: "Użytkownicy",
        data: [
          userCount,
          activeUserCount,
          returningUsersCount,
          newUsersLastMonth || 0,
        ],
        backgroundColor: [
          "#f97316",
          "#fbbf24",
          "#10b981",
          "#6366f1",
        ],
        borderRadius: 8,
      },
    ],
  };

  const doughnutData = {
    labels: ["Wszystkie kursy", "Nowe kursy (miesiąc)"],
    datasets: [
      {
        data: [coursesCount, newCoursesLastMonth || 0],
        backgroundColor: ["#6366f1", "#fbbf24"],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            📊 Panel analityczny nauczyciela
          </h1>
          <p className="text-gray-600 mt-2">
            Przegląd statystyk Twoich kursów i aktywności studentów
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-6 w-6 text-green-500" />
          <span className="text-sm text-gray-600">Dane w czasie rzeczywistym</span>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Łączna liczba kursów
            </CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{coursesCount}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Wszyscy kursanci
            </CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{userCount}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Wszystkie moduły
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{modulesCount}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Średnie ukończenie
            </CardTitle>
            <Target className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{averageCompletionRate}</div>
            <Progress value={parseFloat(averageCompletionRate.replace('%', ''))} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* User Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Aktywni (7 dni)
            </CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{activeUserCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Powracający użytkownicy
            </CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{returningUsersCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Nowi użytkownicy (miesiąc)
            </CardTitle>
            <UserPlus className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{newUsersLastMonth || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Nowe kursy (miesiąc)
            </CardTitle>
            <BookOpen className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{newCoursesLastMonth || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Aktywność użytkowników</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Bar data={barData} options={{
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Statystyki kursów</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-64 h-64">
              <Doughnut data={doughnutData} options={{
                plugins: { legend: { position: "bottom" } },
                maintainAspectRatio: false
              }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {typeof mostPopularCourse === "string" && mostPopularCourse !== "???" && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <Star className="h-5 w-5" />
                <span>Najpopularniejszy kurs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-blue-900">{mostPopularCourse}</p>
            </CardContent>
          </Card>
        )}

        {mostActiveStudent && mostActiveStudent !== "???" && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-800">
                <Award className="h-5 w-5" />
                <span>Najbardziej aktywny student</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-green-900">{mostActiveStudent}</p>
            </CardContent>
          </Card>
        )}

        {mostCoursesStudent && mostCoursesStudent !== "???" && (
          <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-800">
                <Trophy className="h-5 w-5" />
                <span>Student z największą liczbą kursów</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-purple-900">{mostCoursesStudent}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Educational Paths Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Statystyki ścieżek edukacyjnych</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{pathsCount || 0}</div>
              <div className="text-sm text-blue-800">Ścieżki edukacyjne</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{pathUserCount || 0}</div>
              <div className="text-sm text-green-800">Użytkownicy ścieżek</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{pathCoursesCount || 0}</div>
              <div className="text-sm text-purple-800">Kursy w ścieżkach</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{averagePathCompletionRate || "0%"}</div>
              <div className="text-sm text-orange-800">Średnie ukończenie</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Course Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Szczegółowe statystyki kursów</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nazwa kursu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kursanci
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Moduły
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Śr. ukończenia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Najbardziej aktywny
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ostatnio aktywny
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data aktywności
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {coursesDetails.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Brak danych o kursach</p>
                      <p className="text-sm">Utwórz pierwszy kurs, aby zobaczyć statystyki</p>
                    </td>
                  </tr>
                ) : (
                  coursesDetails.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{course.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {course.usersCount}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          {course.modulesCount}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{course.averageCompletionRate}</span>
                          <div className="w-16">
                            <Progress 
                              value={parseFloat(course.averageCompletionRate.replace('%', ''))} 
                              className="h-2" 
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.mostActiveUser}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.lastActiveUser}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.lastActiveDate
                          ? new Date(course.lastActiveDate).toLocaleString("pl-PL")
                          : "Brak"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Educational Paths Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Szczegółowe statystyki ścieżek edukacyjnych</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nazwa ścieżki
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Użytkownicy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kursy w ścieżce
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Śr. ukończenia
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pathsDetails.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Brak danych o ścieżkach edukacyjnych</p>
                      <p className="text-sm">Utwórz pierwszą ścieżkę, aby zobaczyć statystyki</p>
                    </td>
                  </tr>
                ) : (
                  pathsDetails.map((path) => (
                    <tr key={path.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{path.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {path.usersCount}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {path.coursesCount}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{path.averageCompletionRate}</span>
                          <div className="w-16">
                            <Progress 
                              value={parseFloat(path.averageCompletionRate.replace('%', ''))} 
                              className="h-2" 
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer Tip */}
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <CardContent className="p-6 text-center">
          <BarChart3 className="h-8 w-8 mx-auto mb-4 text-orange-500" />
          <h3 className="text-xl font-semibold mb-2 text-orange-800">Wskazówka</h3>
          <p className="text-orange-700">
            Kliknij na kurs, aby zobaczyć szczegółowe statystyki i przeanalizować postęp studentów.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
