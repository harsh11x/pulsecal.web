import { Card } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

interface Activity {
  id: string
  type: string
  description: string
  timestamp: Date
  user?: string
}

interface RecentActivityCardProps {
  activities: Activity[]
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 border-b border-border last:border-0 pb-3 last:pb-0"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.description}</p>
                {activity.user && <p className="text-xs text-muted-foreground">by {activity.user}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
