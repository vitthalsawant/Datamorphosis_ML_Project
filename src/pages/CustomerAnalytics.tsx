import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, User, TrendingUp, Clock, Calendar, Download, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { useAnalyticsExport } from '@/hooks/useAnalyticsExport';
import { toast } from 'sonner';

// Mock analytics data
const VISITOR_DATA = {
  today: 342,
  male: 189,
  female: 153,
  vipCount: 12,
  avgDwellTime: '14 min',
  peakHour: '3:00 PM',
};

const HOURLY_VISITORS = [
  { hour: '9AM', visitors: 25, male: 14, female: 11 },
  { hour: '10AM', visitors: 42, male: 22, female: 20 },
  { hour: '11AM', visitors: 58, male: 30, female: 28 },
  { hour: '12PM', visitors: 78, male: 42, female: 36 },
  { hour: '1PM', visitors: 65, male: 35, female: 30 },
  { hour: '2PM', visitors: 82, male: 44, female: 38 },
  { hour: '3PM', visitors: 95, male: 52, female: 43 },
  { hour: '4PM', visitors: 73, male: 40, female: 33 },
  { hour: '5PM', visitors: 61, male: 33, female: 28 },
  { hour: '6PM', visitors: 48, male: 26, female: 22 },
];

const WEEKLY_VISITORS = [
  { day: 'Mon', visitors: 285, male: 156, female: 129 },
  { day: 'Tue', visitors: 342, male: 189, female: 153 },
  { day: 'Wed', visitors: 398, male: 215, female: 183 },
  { day: 'Thu', visitors: 312, male: 171, female: 141 },
  { day: 'Fri', visitors: 456, male: 248, female: 208 },
  { day: 'Sat', visitors: 523, male: 286, female: 237 },
  { day: 'Sun', visitors: 412, male: 225, female: 187 },
];

const GENDER_DATA = [
  { name: 'Male', value: VISITOR_DATA.male, color: 'hsl(var(--primary))' },
  { name: 'Female', value: VISITOR_DATA.female, color: 'hsl(var(--accent))' },
];

const AGE_DISTRIBUTION = [
  { age: '18-25', count: 78 },
  { age: '26-35', count: 124 },
  { age: '36-45', count: 86 },
  { age: '46-55', count: 42 },
  { age: '55+', count: 12 },
];

const CustomerAnalytics: React.FC = () => {
  const { exportToCSV, exportToPDF } = useAnalyticsExport();

  const handleExportCSV = () => {
    exportToCSV({
      visitorData: VISITOR_DATA,
      hourlyVisitors: HOURLY_VISITORS,
      weeklyVisitors: WEEKLY_VISITORS,
      ageDistribution: AGE_DISTRIBUTION,
    });
    toast.success('CSV report downloaded successfully');
  };

  const handleExportPDF = () => {
    exportToPDF({
      visitorData: VISITOR_DATA,
      hourlyVisitors: HOURLY_VISITORS,
      weeklyVisitors: WEEKLY_VISITORS,
      ageDistribution: AGE_DISTRIBUTION,
    });
    toast.success('PDF report downloaded successfully');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Visitor insights and counting statistics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button onClick={handleExportPDF} className="gap-2">
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{VISITOR_DATA.today}</p>
                  <p className="text-xs text-muted-foreground">Today's Visitors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{VISITOR_DATA.male}</p>
                  <p className="text-xs text-muted-foreground">Male Visitors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{VISITOR_DATA.female}</p>
                  <p className="text-xs text-muted-foreground">Female Visitors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-background" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{VISITOR_DATA.vipCount}</p>
                  <p className="text-xs text-muted-foreground">VIP Detected</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{VISITOR_DATA.avgDwellTime}</p>
                  <p className="text-xs text-muted-foreground">Avg. Dwell Time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{VISITOR_DATA.peakHour}</p>
                  <p className="text-xs text-muted-foreground">Peak Hour</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Hourly Visitors */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Hourly Visitor Count
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={HOURLY_VISITORS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="male" fill="hsl(var(--primary))" name="Male" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="female" fill="hsl(var(--accent))" name="Female" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gender Distribution */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Gender Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={GENDER_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {GENDER_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Trend */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Weekly Visitor Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={WEEKLY_VISITORS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="visitors" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))' }} />
                  <Line type="monotone" dataKey="male" stroke="hsl(220, 80%, 60%)" strokeWidth={2} dot={{ fill: 'hsl(220, 80%, 60%)' }} />
                  <Line type="monotone" dataKey="female" stroke="hsl(330, 80%, 60%)" strokeWidth={2} dot={{ fill: 'hsl(330, 80%, 60%)' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Age Distribution */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Age Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={AGE_DISTRIBUTION} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="age" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerAnalytics;
