import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface VisitorData {
  today: number;
  male: number;
  female: number;
  vipCount: number;
  avgDwellTime: string;
  peakHour: string;
}

interface HourlyData {
  hour: string;
  visitors: number;
  male: number;
  female: number;
}

interface WeeklyData {
  day: string;
  visitors: number;
  male: number;
  female: number;
}

interface AgeData {
  age: string;
  count: number;
}

interface ExportData {
  visitorData: VisitorData;
  hourlyVisitors: HourlyData[];
  weeklyVisitors: WeeklyData[];
  ageDistribution: AgeData[];
}

export const useAnalyticsExport = () => {
  const exportToCSV = (data: ExportData) => {
    const { visitorData, hourlyVisitors, weeklyVisitors, ageDistribution } = data;
    
    let csv = 'Analytics Report\n\n';
    
    // Summary section
    csv += 'Summary Statistics\n';
    csv += 'Metric,Value\n';
    csv += `Total Visitors Today,${visitorData.today}\n`;
    csv += `Male Visitors,${visitorData.male}\n`;
    csv += `Female Visitors,${visitorData.female}\n`;
    csv += `VIP Detected,${visitorData.vipCount}\n`;
    csv += `Average Dwell Time,${visitorData.avgDwellTime}\n`;
    csv += `Peak Hour,${visitorData.peakHour}\n\n`;
    
    // Hourly data
    csv += 'Hourly Visitor Count\n';
    csv += 'Hour,Total Visitors,Male,Female\n';
    hourlyVisitors.forEach(row => {
      csv += `${row.hour},${row.visitors},${row.male},${row.female}\n`;
    });
    csv += '\n';
    
    // Weekly data
    csv += 'Weekly Visitor Trend\n';
    csv += 'Day,Total Visitors,Male,Female\n';
    weeklyVisitors.forEach(row => {
      csv += `${row.day},${row.visitors},${row.male},${row.female}\n`;
    });
    csv += '\n';
    
    // Age distribution
    csv += 'Age Distribution\n';
    csv += 'Age Group,Count\n';
    ageDistribution.forEach(row => {
      csv += `${row.age},${row.count}\n`;
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = (data: ExportData) => {
    const { visitorData, hourlyVisitors, weeklyVisitors, ageDistribution } = data;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.text('Analytics Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });
    
    let yPos = 40;
    
    // Summary Statistics
    doc.setFontSize(14);
    doc.text('Summary Statistics', 14, yPos);
    yPos += 5;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: [
        ['Total Visitors Today', visitorData.today.toString()],
        ['Male Visitors', visitorData.male.toString()],
        ['Female Visitors', visitorData.female.toString()],
        ['VIP Detected', visitorData.vipCount.toString()],
        ['Average Dwell Time', visitorData.avgDwellTime],
        ['Peak Hour', visitorData.peakHour],
      ],
      theme: 'striped',
      headStyles: { fillColor: [45, 45, 45] },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    // Hourly Visitors
    doc.setFontSize(14);
    doc.text('Hourly Visitor Count', 14, yPos);
    yPos += 5;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Hour', 'Total', 'Male', 'Female']],
      body: hourlyVisitors.map(row => [row.hour, row.visitors, row.male, row.female]),
      theme: 'striped',
      headStyles: { fillColor: [45, 45, 45] },
    });
    
    // New page for more data
    doc.addPage();
    yPos = 20;
    
    // Weekly Trend
    doc.setFontSize(14);
    doc.text('Weekly Visitor Trend', 14, yPos);
    yPos += 5;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Day', 'Total', 'Male', 'Female']],
      body: weeklyVisitors.map(row => [row.day, row.visitors, row.male, row.female]),
      theme: 'striped',
      headStyles: { fillColor: [45, 45, 45] },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    // Age Distribution
    doc.setFontSize(14);
    doc.text('Age Distribution', 14, yPos);
    yPos += 5;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Age Group', 'Count']],
      body: ageDistribution.map(row => [row.age, row.count]),
      theme: 'striped',
      headStyles: { fillColor: [45, 45, 45] },
    });
    
    // Download
    doc.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return { exportToCSV, exportToPDF };
};
