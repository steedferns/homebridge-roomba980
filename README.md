# homebridge-roomba980
Roomba 980 support for Homebridge

Credit goes to homebridge-roomba plugin & dorita980. You can look up either git to find information on setup and how to get the BLID and Password for you Roomba.

This version uses a mix of Cloud and Local commands.  Siri waits a maximum of 10 seconds for a device to respond, but the robot takes much longer (even when using Local).  

The solution is to issue 'start' & 'pause' commands using the Cloud, then check 'status' and 'dock' using local commands.

10-22-2016
Added the ability to query the current robot status.  If the robot is not cleaning (running), it will show as powered off. (paused, stopped, or charging).
