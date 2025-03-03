import DataCard from "./_components/data-card";

const AnalyticsPage = () => {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <DataCard label="Total sales" value="3"></DataCard>
        <DataCard label="Total revenue" value="2137" shouldFormat={true}></DataCard>
        <DataCard label="New users" value="150"></DataCard>
        <DataCard label="Active subscriptions" value="85"></DataCard>
        <DataCard label="Pending reviews" value="12"></DataCard>
      </div>
    </div>
  );
};

export default AnalyticsPage;
