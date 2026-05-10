import { useEffect, useMemo, useRef, useState } from "react";
import { X, Search } from "lucide-react";


const TEN_CODES = [
  { code: "10-0", meaning: "Pursuit in Progress" },
  { code: "10-1", meaning: "Signal Weak" },
  { code: "10-2", meaning: "Signal Good" },
  { code: "10-3", meaning: "Stop Transmitting" },
  { code: "10-4", meaning: "Message Received" },
  { code: "10-5", meaning: "Relay" },
  { code: "10-6", meaning: "Busy" },
  { code: "10-7", meaning: "Out of Service" },
  { code: "10-8", meaning: "In Service" },
  { code: "10-9", meaning: "Repeat" },

  { code: "10-10", meaning: "Negative" },
  { code: "10-11", meaning: "On Duty" },
  { code: "10-12", meaning: "Standby" },
  { code: "10-13", meaning: "Report Conditions" },
  { code: "10-14", meaning: "Message / Information" },
  { code: "10-15", meaning: "Message Delivered" },
  { code: "10-16", meaning: "Reply to Message" },
  { code: "10-17", meaning: "Enroute" },
  { code: "10-18", meaning: "Urgent" },
  { code: "10-19", meaning: "In Contact" },

  { code: "10-20", meaning: "Advise Your Location" },
  { code: "10-21", meaning: "Phone Number" },
  { code: "10-22", meaning: "Disregard" },
  { code: "10-23", meaning: "Arrived at Scene" },
  { code: "10-24", meaning: "Assignment Complete" },
  { code: "10-25", meaning: "Meet Up At ____" },
  { code: "10-26", meaning: "Estimated Time of Arrival" },
  { code: "10-27", meaning: "Driver's License" },
  { code: "10-28", meaning: "Vehicle Registration" },
  { code: "10-29", meaning: "Check for Warrants" },

  { code: "10-30", meaning: "Danger / Caution" },
  { code: "10-31", meaning: "Pick Up" },
  { code: "10-32", meaning: "Units Needed Quickly" },
  { code: "10-33", meaning: "Emergency" },
  { code: "10-34", meaning: "Correct Time" },
  { code: "10-35", meaning: "Radar" },
  { code: "10-36", meaning: "Abandoned Vehicle" },
  { code: "10-37", meaning: "Mobile Data Computer" },
  { code: "10-38", meaning: "Normal Traffic Stop" },
  { code: "10-39", meaning: "Vehicle Search" },

  { code: "10-40", meaning: "Road Repairs" },
  { code: "10-41", meaning: "Beginning Shift" },
  { code: "10-42", meaning: "End Shift" },
  { code: "10-43", meaning: "Time Check" },
  { code: "10-44", meaning: "Unable to Locate" },
  { code: "10-45", meaning: "Dead Animal" },
  { code: "10-46", meaning: "Assist Motorist" },
  { code: "10-47", meaning: "Investigate Suspicious Vehicle" },
  { code: "10-48", meaning: "Stopping Suspicious Vehicle" },
  { code: "10-49", meaning: "Civil Disturbance" },

  { code: "10-50", meaning: "Motor Vehicle Accident" },
  { code: "10-51", meaning: "Request Tow Truck" },
  { code: "10-52", meaning: "Request Ambulance" },
  { code: "10-53", meaning: "Roadway Blocked" },
  { code: "10-54", meaning: "Direct Traffic" },
  { code: "10-55", meaning: "Intoxicated Driver" },
  { code: "10-56", meaning: "Intoxicated Pedestrian" },
  { code: "10-57", meaning: "Hit and Run MVA" },
  { code: "10-58", meaning: "Riot" },
  { code: "10-59", meaning: "Person with Gun" },

  { code: "10-60", meaning: "Request Coroner" },
  { code: "10-61", meaning: "Illegal Use of Radio" },
  { code: "10-62", meaning: "Escaped Prisoner" },
  { code: "10-63", meaning: "Advise Phone Number" },
  { code: "10-64", meaning: "Bomb Threat" },
  { code: "10-65", meaning: "Blockade" },
  { code: "10-66", meaning: "Drag Racing" },
  { code: "10-67", meaning: "Subject in Custody" },
  { code: "10-68", meaning: "Mental Subject" },
  { code: "10-69", meaning: "Detaining Subject - Expedite" },

  { code: "10-70", meaning: "Fire Alarm" },
  { code: "10-71", meaning: "Wanted / Stolen Indicated" },
  { code: "10-72", meaning: "Larceny" },
  { code: "10-73", meaning: "Break-in" },
  { code: "10-74", meaning: "Robbery" },
  { code: "10-75", meaning: "Shooting" },
  { code: "10-76", meaning: "Assault" },
  { code: "10-77", meaning: "Vandalism" },
  { code: "10-78", meaning: "Request Assistance" },
  { code: "10-79", meaning: "Prowler" },

  { code: "10-80", meaning: "Suspicious Person" },
  { code: "10-81", meaning: "Missing Person" },
  { code: "10-82", meaning: "Domestic Problem" },
  { code: "10-83", meaning: "Crime in Progress" },
  { code: "10-84", meaning: "Estimated Time of Arrival" },
  { code: "10-85", meaning: "Alarm" },
  { code: "10-86", meaning: "Out of Vehicle - Available" },
  { code: "10-87", meaning: "Permission to Leave Patrol" },
  { code: "10-88", meaning: "Squad in Vicinity" },
  { code: "10-89", meaning: "Escort" },

  { code: "10-90", meaning: "Prepare to Copy" },
  { code: "10-91", meaning: "Return To ____" },
  { code: "10-92", meaning: "Delayed" },
  { code: "10-93", meaning: "Message Received" },
  { code: "10-94", meaning: "General Broadcast" },
  { code: "10-95", meaning: "Prisoner" },
  { code: "10-96", meaning: "Breathalyzer Operator" },
  { code: "10-97", meaning: "Test Signal" },
  { code: "10-98", meaning: "Switch to Regional Channel" },
  { code: "10-99", meaning: "Traffic Signal Not Working" },
];

const SIGNAL_CODES = [
  { code: "Signal 1", meaning: "Handle by Mail" },
  { code: "Signal 2", meaning: "Delivered" },
  { code: "Signal 3", meaning: "Delivered" },

  // Two different Signal 4 meanings in source data
  { code: "Signal 4A", meaning: "Changing Channel / Comm Center" },
  { code: "Signal 4B", meaning: "Use Lights / Siren" },

  { code: "Signal 5", meaning: "Permission to Use Patrol Car" },
  { code: "Signal 6", meaning: "Permission to Go to Columbia HQ" },
  { code: "Signal 7", meaning: "Send ___ to Columbia for Vehicle" },
  { code: "Signal 8", meaning: "Permission to Go to Columbia HQ" },
  { code: "Signal 9", meaning: "Confidential Investigation" },

  { code: "Signal 10", meaning: "Remain in Vehicle / Stay in Service" },
  { code: "Signal 11", meaning: "If Not Stolen, Check Owner Disposition" },
  { code: "Signal 12", meaning: "No Information Available" },
  { code: "Signal 13", meaning: "Request to Go Out of Service" },
  { code: "Signal 14", meaning: "Relay to Local Broadcast Stations" },
  { code: "Signal 15", meaning: "Resume Normal Operations" },
  { code: "Signal 16", meaning: "Out of Vehicle, Radio On" },
  { code: "Signal 17", meaning: "Officer-Initiated Complaint" },
  { code: "Signal 18", meaning: "No Further Assistance Needed" },
  { code: "Signal 19", meaning: "Do Not Use Radio" },

  { code: "Signal 20", meaning: "Tower Lights Out" },
  { code: "Signal 21", meaning: "Visitors Present" },
  { code: "Signal 22", meaning: "Zone Assignment" },

  { code: "Signal 24", meaning: "Sex Offender" },

  { code: "Signal 26", meaning: "Switch to Channel 1" },
  { code: "Signal 27", meaning: "Switch to Channel 2" },
  { code: "Signal 28", meaning: "Switch to Channel 3" },
  { code: "Signal 29", meaning: "Switch to Channel 5" },

  { code: "Signal 30", meaning: "Rape" },
  { code: "Signal 31", meaning: "Kidnapping" },
  { code: "Signal 32", meaning: "Homicide" },
  { code: "Signal 33", meaning: "Armed Robbery" },
  { code: "Signal 34", meaning: "Strong-Arm Robbery" },
  { code: "Signal 35", meaning: "Burglary from Vehicle" },
  { code: "Signal 36", meaning: "Animal Complaint" },
  { code: "Signal 37", meaning: "Unlocked Vehicle" },
  { code: "Signal 38", meaning: "Human Error" },
  { code: "Signal 39", meaning: "Mechanical Error" },
  { code: "Signal 40", meaning: "Residence Check" },
];

function CodeCard({ code, meaning }) {
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-5 hover:bg-zinc-700 transition-colors">
      <div className="text-3xl font-mono font-bold text-cyan-400">
        {code}
      </div>

      <div className="text-zinc-200 mt-2 text-xl leading-snug">
        {meaning}
      </div>
    </div>
  );
}

export default function CodeOverlay({
  open,
  onClose,
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if (!open) return;

      // ESC closes
      if (e.key === "Escape") {
        onClose();
      }

      // / focuses search
      if (e.key === "/" && !e.ctrlKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Ctrl+F focuses search
      if (e.ctrlKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener(
        "keydown",
        handler
      );
    };
  }, [open, onClose]);

  const filteredTenCodes = useMemo(() => {
    const q = search.toLowerCase();

    return TEN_CODES.filter((item) =>
      item.code.toLowerCase().includes(q) ||
      item.meaning.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredSignalCodes = useMemo(() => {
    const q = search.toLowerCase();

    return SIGNAL_CODES.filter((item) =>
      item.code.toLowerCase().includes(q) ||
      item.meaning.toLowerCase().includes(q)
    );
  }, [search]);

  if (!open) return null;

  const noResults =
    filteredTenCodes.length === 0 &&
    filteredSignalCodes.length === 0;

  return (
<div className="fixed inset-0 z-[9999] bg-black/35 backdrop-blur-[2px] flex items-center justify-center p-4 lg:p-6">
  <div className="bg-zinc-900/72 border border-zinc-600/60 rounded-2xl w-full max-w-7xl h-[92vh] shadow-2xl overflow-hidden backdrop-blur-md backdrop-saturate-150">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-700">
          <div>
            <h2 className="text-4xl font-bold text-white">
              Highway Patrol Radio Codes
            </h2>

            <div className="text-zinc-400 mt-1 text-lg">
              Highway Patrol
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-3 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X size={32} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-zinc-700">
          <div className="relative">
            <Search
              size={22}
              className="absolute left-4 top-4 text-zinc-500"
            />

            <input
              ref={inputRef}
              type="text"
              placeholder="Search code or meaning..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-4 pl-12 pr-4 text-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          {search && (
             <button
               onClick={() => setSearch("")}
               className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
             >
               <X size={22} />
             </button>
           )}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(92vh-170px)] p-6">

          {noResults ? (
            <div className="h-full flex items-center justify-center text-zinc-500 text-2xl">
              No matching radio codes
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* 10 Codes */}
              <div>
                <div className="sticky top-0 bg-zinc-900 pb-3 z-10">
                  <h3 className="text-3xl font-bold text-white">
                    10-Codes ({filteredTenCodes.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {filteredTenCodes.map((item) => (
                    <CodeCard
                      key={item.code}
                      code={item.code}
                      meaning={item.meaning}
                    />
                  ))}
                </div>
              </div>

              {/* Signal Codes */}
              <div>
                <div className="sticky top-0 bg-zinc-900 pb-3 z-10">
                  <h3 className="text-3xl font-bold text-white">
                    Signal Codes ({filteredSignalCodes.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {filteredSignalCodes.map((item) => (
                    <CodeCard
                      key={item.code}
                      code={item.code}
                      meaning={item.meaning}
                    />
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
