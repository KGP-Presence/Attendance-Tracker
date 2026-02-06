// config/slotMatrix.js

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