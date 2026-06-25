import { createClientFromRequest } from 'npm:@base44/sdk@0.8.34';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Admin-only function (the scheduled task runner invokes this as an admin)
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tz = "America/New_York";
    const now = new Date();
    
    // Format dates to YYYY-MM-DD in the user's timezone
    const formatter = new Intl.DateTimeFormat('en-CA', { 
      timeZone: tz, 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
    
    const todayStr = formatter.format(now);
    
    // Calculate tomorrow
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = formatter.format(tomorrow);

    // Get all currently "scheduled" jobs
    const jobs = await base44.asServiceRole.entities.Job.filter({ status: "scheduled" });
    
    // Find jobs scheduled for today or earlier
    const overdueJobs = jobs.filter(j => j.scheduled_date && j.scheduled_date <= todayStr);

    let updatedCount = 0;
    if (overdueJobs.length > 0) {
      const updates = overdueJobs.map(j => ({
        id: j.id,
        scheduled_date: tomorrowStr
      }));
      
      // Update them all at once
      await base44.asServiceRole.entities.Job.bulkUpdate(updates);
      updatedCount = updates.length;
    }

    return Response.json({ 
      success: true, 
      updatedCount, 
      overdueLimit: todayStr, 
      newDate: tomorrowStr 
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});