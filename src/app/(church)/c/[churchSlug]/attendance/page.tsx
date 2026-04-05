import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarCheck, Plus } from "lucide-react";

interface AttendancePageProps {
  params: { churchSlug: string };
}

export default async function AttendancePage({ params }: AttendancePageProps) {
  const supabase = await createClient();

  const { data: church } = await supabase
    .from("churches")
    .select("*")
    .eq("slug", params.churchSlug)
    .single();

  if (!church) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">
            Track attendance for services and events
          </p>
        </div>
        <Button asChild>
          <Link href={`/c/${params.churchSlug}/attendance/record`}>
            <Plus className="mr-2 h-4 w-4" />
            Record Attendance
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CalendarCheck className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Attendance tracking coming soon
          </p>
          <p className="text-sm text-muted-foreground">
            This feature is under development
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

