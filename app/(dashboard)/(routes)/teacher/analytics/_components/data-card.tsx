import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DataCardProps {
    value: string;
    label: string;
    shouldFormat?: boolean;
}

export default function DataCard({value, label, shouldFormat}: DataCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {shouldFormat ? new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(parseInt(value)) : value}
                </div>
            </CardContent>
        </Card>
    );

}