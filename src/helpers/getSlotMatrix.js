// config/slotMatrix.js
export const convertTimeSlot = (slot) => {
  const [start] = slot.split("-");

  const hour = parseInt(start);
  const period = start.slice(-2); // AM or PM

  return `${hour}:00 ${period} - ${hour}:55 ${period}`;
};

export const reverseTimeSlot = (day, slot) => {
  // slot example: "9:00 AM - 9:55 AM"
  const [start] = slot.split(" - "); // "9:00 AM"
  
  const [time, period] = start.split(" "); // ["9:00", "AM"]
  const hour = parseInt(time.split(":")[0]);

  // calculate next hour
  let nextHour = hour + 1;

  // handle 12 wrap case
  if (hour === 12) {
    nextHour = 1;
  }

  const formattedDay = day.toUpperCase();

  return `${formattedDay}_${hour}${period}-${nextHour}${period}`;
};


export const getDayName = (dateObj) => {
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  return days[dateObj.getDay()];
};

// Mapped exactly from the IIT KGP Spring 2025-26 Timetable Matrix
export const SLOT_MATRIX = {
  MONDAY: {
    // Theory Slots
    "A": ["8:00 AM - 8:55 AM", "9:00 AM - 9:55 AM"], // A3(1), A3(1,2)
    "C": ["10:00 AM - 10:55 AM"], // C3(1)
    "B": ["11:00 AM - 11:55 AM"], // B3(1)
    "D": ["12:00 PM - 12:55 PM"], // D3(1)
    "H": ["2:00 PM - 2:55 PM"],   // H3(1)
    "U": ["3:00 PM - 3:55 PM", "4:00 PM - 4:55 PM"], // U3(1,2)
    "S": ["5:00 PM - 5:55 PM"],   // S3(1)
    
    // Lab Slots (Morning & Afternoon)
    "Q": ["10:00 AM - 10:55 AM", "11:00 AM - 11:55 AM", "12:00 PM - 12:55 PM"], // Lab Slot Q (Morning)
    "J": ["2:00 PM - 2:55 PM", "3:00 PM - 3:55 PM", "4:00 PM - 4:55 PM"]      // Lab Slot J (Afternoon)
  },

  TUESDAY: {
    // Theory Slots
    "B": ["8:00 AM - 8:55 AM", "9:00 AM - 9:55 AM"], // B2, B3(2,3)
    "D": ["10:00 AM - 10:55 AM", "11:00 AM - 11:55 AM"], // D2, D3(2,3)
    "A": ["12:00 PM - 12:55 PM"], // A3(3)
    "U": ["2:00 PM - 2:55 PM", "3:00 PM - 3:55 PM"], // U3(3), U4(3,4)
    "H": ["4:00 PM - 4:55 PM", "5:00 PM - 5:55 PM"], // H2, H3(2,3)

    // Lab Slots
    "K": ["10:00 AM - 10:55 AM", "11:00 AM - 11:55 AM", "12:00 PM - 12:55 PM"], // Lab Slot K
    "L": ["2:00 PM - 2:55 PM", "3:00 PM - 3:55 PM", "4:00 PM - 4:55 PM"]       // Lab Slot L
  },

  WEDNESDAY: {
    // Theory Slots
    "C": ["8:00 AM - 8:55 AM", "9:00 AM - 9:55 AM"], // C2, C3(2,3)
    "F": ["10:00 AM - 10:55 AM"], // F3(1)
    "G": ["11:00 AM - 11:55 AM"], // G3(1)
    "E": ["12:00 PM - 12:55 PM"], // E3(1)
    "X": ["2:00 PM - 2:55 PM", "3:00 PM - 3:55 PM", "4:00 PM - 4:55 PM", "5:00 PM - 5:55 PM"], // X4(1,2,3,4)

    // Lab Slots
    "R": ["10:00 AM - 10:55 AM", "11:00 AM - 11:55 AM", "12:00 PM - 12:55 PM"], // Lab Slot R
    // Note: Lab Slot X overlaps with Theory X
    "LAB_X": ["2:00 PM - 2:55 PM", "3:00 PM - 3:55 PM", "4:00 PM - 4:55 PM"] 
  },

  THURSDAY: {
    // Theory Slots (Single hour rotation)
    "D": ["8:00 AM - 8:55 AM"],   // D4(4)
    "F": ["9:00 AM - 9:55 AM"],   // F3(2) (Note: Shifted compared to standard years, based on image)
    "C": ["10:00 AM - 10:55 AM"], // C4(4)
    "E": ["11:00 AM - 11:55 AM"], // E3(2)
    "G": ["12:00 PM - 12:55 PM"], // G3(2)
    "I": ["2:00 PM - 2:55 PM"],   // I2(1)
    "V": ["3:00 PM - 3:55 PM", "4:00 PM - 4:55 PM"], // V2, V3(1,2)
    "S": ["5:00 PM - 5:55 PM"],   // S3(2)

    // Lab Slots
    "M": ["10:00 AM - 10:55 AM", "11:00 AM - 11:55 AM", "12:00 PM - 12:55 PM"], // Lab Slot M
    "N": ["2:00 PM - 2:55 PM", "3:00 PM - 3:55 PM", "4:00 PM - 4:55 PM"]       // Lab Slot N
  },

  FRIDAY: {
    // Theory Slots
    "G": ["8:00 AM - 8:55 AM"],   // G3(3)
    "E": ["9:00 AM - 9:55 AM", "10:00 AM - 10:55 AM"], // E2, E3(3)
    "F": ["11:00 AM - 11:55 AM", "12:00 PM - 12:55 PM"], // F3(3), F2
    "V": ["2:00 PM - 2:55 PM", "3:00 PM - 3:55 PM"], // V4(3,4), V3(3)
    "I": ["4:00 PM - 4:55 PM"],   // I2(2)
    "S": ["5:00 PM - 5:55 PM"],   // S3(3)

    // Lab Slots
    "O": ["10:00 AM - 10:55 AM", "11:00 AM - 11:55 AM", "12:00 PM - 12:55 PM"], // Lab Slot O
    "P": ["2:00 PM - 2:55 PM", "3:00 PM - 3:55 PM", "4:00 PM - 4:55 PM"]       // Lab Slot P
  },

  SATURDAY: {
    "EAA": ["8:00 AM - 12:55 PM"] // Extra Academic Activity (Green slot)
  }
};

export const timeSlots = {
  "A2": ["MONDAY_8AM-9AM", "MONDAY_9AM-10AM"],
  "A3": ["MONDAY_8AM-9AM", "MONDAY_9AM-10AM", "TUESDAY_12PM-1PM"],
  "B2": ["TUESDAY_8AM-9AM", "TUESDAY_9AM-10AM"],
  "B3": ["MONDAY_11AM-12PM", "TUESDAY_8AM-9AM", "TUESDAY_9AM-10AM"],
  "C2": ["WEDNESDAY_8AM-9AM", "WEDNESDAY_9AM-10AM"],
  "C3": ["MONDAY_10AM-11AM", "WEDNESDAY_8AM-9AM", "WEDNESDAY_9AM-10AM"],
  "C4": ["MONDAY_10AM-11AM", "WEDNESDAY_8AM-9AM", "WEDNESDAY_9AM-10AM", "THURSDAY_10AM-11AM"],
  "D2": ["TUESDAY_10AM-11AM", "TUESDAY_11AM-12PM"],
  "D3": ["MONDAY_12PM-1PM", "TUESDAY_10AM-11AM", "TUESDAY_11AM-12PM"],
  "D4": ["MONDAY_12PM-1PM", "TUESDAY_10AM-11AM", "TUESDAY_11AM-12PM", "THURSDAY_8AM-9AM"],
  "E2": ["FRIDAY_9AM-10AM", "FRIDAY_10AM-11AM"],
  "E3": ["WEDNESDAY_12PM-1PM", "THURSDAY_11AM-12PM", "FRIDAY_9AM-10AM"],
  "E4": ["WEDNESDAY_12PM-1PM", "THURSDAY_11AM-12PM", "FRIDAY_9AM-10AM", "FRIDAY_10AM-11AM"],
  "F2": ["FRIDAY_10AM-11AM", "FRIDAY_11AM-12PM"],
  "F3": ["WEDNESDAY_10AM-11AM", "THURSDAY_9AM-10AM", "FRIDAY_10AM-11AM"],
  "F4": ["WEDNESDAY_10AM-11AM", "THURSDAY_9AM-10AM", "FRIDAY_10AM-11AM", "FRIDAY_11AM-12PM"],
  "G3": ["WEDNESDAY_11AM-12PM", "THURSDAY_12PM-1PM", "FRIDAY_8AM-9AM"],
  "H2": ["TUESDAY_4PM-5PM", "TUESDAY_5PM-6PM"],
  "H3": ["MONDAY_2PM-3PM", "TUESDAY_4PM-5PM", "TUESDAY_5PM-6PM"],
  "I2": ["THURSDAY_2PM-3PM", "FRIDAY_3PM-4PM"],
  "S3": ["MONDAY_5PM-6PM", "THURSDAY_5PM-6PM", "FRIDAY_5PM-6PM"],
  "U3": ["MONDAY_3PM-4PM", "MONDAY_4PM-5PM", "TUESDAY_3PM-4PM"],
  "U4": ["MONDAY_3PM-4PM", "MONDAY_4PM-5PM", "TUESDAY_2PM-3PM", "TUESDAY_3PM-4PM"],
  "V2": ["THURSDAY_3PM-4PM", "THURSDAY_4PM-5PM"],
  "V3": ["THURSDAY_3PM-4PM", "THURSDAY_4PM-5PM", "FRIDAY_2PM-3PM"],
  "V4": ["THURSDAY_3PM-4PM", "THURSDAY_4PM-5PM", "FRIDAY_2PM-3PM", "FRIDAY_3PM-4PM"],
  "X4": ["WEDNESDAY_2PM-3PM", "WEDNESDAY_3PM-4PM", "WEDNESDAY_4PM-5PM", "WEDNESDAY_5PM-6PM"],
  "LAB SLOT: J": ["MONDAY_2PM-3PM", "MONDAY_3PM-4PM", "MONDAY_4PM-5PM"],
  "LAB SLOT: K": ["TUESDAY_10AM-11AM", "TUESDAY_11AM-12PM"],
  "LAB SLOT: L": ["TUESDAY_2PM-3PM", "TUESDAY_3PM-4PM", "TUESDAY_4PM-5PM"],
  "LAB SLOT: M": ["THURSDAY_10AM-11AM", "THURSDAY_11AM-12PM", "THURSDAY_12PM-1PM"],
  "LAB SLOT: N": ["THURSDAY_2PM-3PM", "THURSDAY_3PM-4PM", "THURSDAY_4PM-5PM"],
  "LAB SLOT: O": ["FRIDAY_9AM-10AM", "FRIDAY_10AM-11AM", "FRIDAY_11AM-12PM", "FRIDAY_12PM-1PM"],
  "LAB SLOT: P": ["FRIDAY_2PM-3PM", "FRIDAY_3PM-4PM", "FRIDAY_4PM-5PM"],
  "LAB SLOT: Q": ["MONDAY_10AM-11AM", "MONDAY_11AM-12PM", "MONDAY_12PM-1PM"],
  "LAB SLOT: R": ["WEDNESDAY_10AM-11AM", "WEDNESDAY_11AM-12PM", "WEDNESDAY_12PM-1PM"],
  "LAB SLOT: X": ["WEDNESDAY_2PM-3PM", "WEDNESDAY_3PM-4PM", "WEDNESDAY_4PM-5PM"],
  "EAA": ["SATURDAY_8AM-9AM", "SATURDAY_9AM-10AM", "SATURDAY_10AM-11AM", "SATURDAY_11AM-12PM", "SATURDAY_12PM-1PM"]
};

export const slots = {
  "MONDAY_8AM-9AM": ["A2", "A3"],
  "MONDAY_9AM-10AM": ["A2", "A3"],
  "MONDAY_10AM-11AM": ["C3", "C4", "LAB SLOT: Q"],
  "MONDAY_11AM-12PM": ["B3", "LAB SLOT: Q"],
  "MONDAY_12PM-1PM": ["D3", "D4", "LAB SLOT: Q"],
  "MONDAY_2PM-3PM": ["H3", "LAB SLOT: J"],
  "MONDAY_3PM-4PM": ["U3", "U4", "LAB SLOT: J"],
  "MONDAY_4PM-5PM": ["U3", "U4", "LAB SLOT: J"],
  "MONDAY_5PM-6PM": ["S3"],
  "TUESDAY_8AM-9AM": ["B2", "B3"],
  "TUESDAY_9AM-10AM": ["B2", "B3"],
  "TUESDAY_10AM-11AM": ["D2", "D3", "D4", "LAB SLOT: K"],
  "TUESDAY_11AM-12PM": ["D2", "D3", "D4", "LAB SLOT: K"],
  "TUESDAY_12PM-1PM": ["A3"],
  "TUESDAY_2PM-3PM": ["U4", "LAB SLOT: L"],
  "TUESDAY_3PM-4PM": ["U3", "LAB SLOT: L"],
  "TUESDAY_4PM-5PM": ["H2", "H3", "LAB SLOT: L"],
  "TUESDAY_5PM-6PM": ["H2", "H3"],
  "WEDNESDAY_8AM-9AM": ["C2", "C3", "C4"],
  "WEDNESDAY_9AM-10AM": ["C2", "C3", "C4"],
  "WEDNESDAY_10AM-11AM": ["F3", "F4", "LAB SLOT: R"],
  "WEDNESDAY_11AM-12PM": ["G3", "LAB SLOT: R"],
  "WEDNESDAY_12PM-1PM": ["E3", "E4", "LAB SLOT: R"],
  "WEDNESDAY_2PM-3PM": ["X4", "LAB SLOT: X"],
  "WEDNESDAY_3PM-4PM": ["X4", "LAB SLOT: X"],
  "WEDNESDAY_4PM-5PM": ["X4", "LAB SLOT: X"],
  "WEDNESDAY_5PM-6PM": ["X4"],
  "THURSDAY_8AM-9AM": ["D4"],
  "THURSDAY_9AM-10AM": ["F3", "F4"],
  "THURSDAY_10AM-11AM": ["C4", "LAB SLOT: M"],
  "THURSDAY_11AM-12PM": ["E3", "E4", "LAB SLOT: M"],
  "THURSDAY_12PM-1PM": ["G3", "LAB SLOT: M"],
  "THURSDAY_2PM-3PM": ["I2", "LAB SLOT: N"],
  "THURSDAY_3PM-4PM": ["V2", "V3", "V4", "LAB SLOT: N"],
  "THURSDAY_4PM-5PM": ["V2", "V3", "V4", "LAB SLOT: N"],
  "THURSDAY_5PM-6PM": ["S3"],
  "FRIDAY_8AM-9AM": ["G3"],
  "FRIDAY_9AM-10AM": ["E2", "E3", "E4", "LAB SLOT: O"],
  "FRIDAY_10AM-11AM": ["E2", "E4", "F2", "F3", "F4", "LAB SLOT: O"],
  "FRIDAY_11AM-12PM": ["F2", "F4", "LAB SLOT: O"],
  "FRIDAY_12PM-1PM": ["LAB SLOT: O"],
  "FRIDAY_2PM-3PM": ["V3", "V4", "LAB SLOT: P"],
  "FRIDAY_3PM-4PM": ["I2", "V4", "LAB SLOT: P"],
  "FRIDAY_4PM-5PM": ["LAB SLOT: P"],
  "FRIDAY_5PM-6PM": ["S3"],
  "SATURDAY_8AM-9AM": ["EAA"],
  "SATURDAY_9AM-10AM": ["EAA"],
  "SATURDAY_10AM-11AM": ["EAA"],
  "SATURDAY_11AM-12PM": ["EAA"],
  "SATURDAY_12PM-1PM": ["EAA"]
};