import mongoose from "mongoose";
import dotenv from "dotenv";
import { Department } from "../Models/department.model.js";
import { DB_NAME } from "../constants.js";

dotenv.config();

const departmentsData = [
  { longName: "AEROSPACE ENGINEERING", shortCode: "AE", type: "DEPARTMENT" },
  { longName: "AGRICULTURAL AND FOOD ENGINEERING", shortCode: "AG", type: "DEPARTMENT" },
  { longName: "ARCHITECTURE AND REGIONAL PLANNING", shortCode: "AR", type: "DEPARTMENT" },
  { longName: "Artificial Intelligence", shortCode: "AI", type: "CENTRE" },
  { longName: "Bioscience and Biotechnology", shortCode: "BT", type: "DEPARTMENT" },
  { longName: "CHEMICAL ENGINEERING", shortCode: "CH", type: "DEPARTMENT" },
  { longName: "CHEMISTRY", shortCode: "CY", type: "DEPARTMENT" },
  { longName: "CIVIL ENGINEERING", shortCode: "CE", type: "DEPARTMENT" },
  { longName: "COMPUTER SCIENCE & ENGINEERING", shortCode: "CS", type: "DEPARTMENT" },
  { longName: "Education", shortCode: "ED", type: "SCHOOL" },
  { longName: "ELECTRICAL ENGINEERING", shortCode: "EE", type: "DEPARTMENT" },
  { longName: "ELECTRONICS & ELECTRICAL COMMUNICATION ENGG.", shortCode: "EC", type: "DEPARTMENT" },
  { longName: "GEOLOGY & GEOPHYSICS", shortCode: "GG", type: "DEPARTMENT" },
  { longName: "HUMANITIES & SOCIAL SCIENCES", shortCode: "HS", type: "DEPARTMENT" },
  { longName: "INDUSTRIAL AND SYSTEMS ENGINEERING", shortCode: "IE", type: "DEPARTMENT" },
  { longName: "MATHEMATICS", shortCode: "MA", type: "DEPARTMENT" },
  { longName: "MECHANICAL ENGINEERING", shortCode: "ME", type: "DEPARTMENT" },
  { longName: "METALLURGICAL & MATERIALS ENGINEERING", shortCode: "MT", type: "DEPARTMENT" },
  { longName: "MINING ENGINEERING", shortCode: "MI", type: "DEPARTMENT" },
  { longName: "Ocean Engg and Naval Architecture", shortCode: "NA", type: "DEPARTMENT" },
  { longName: "PHYSICS", shortCode: "PH", type: "DEPARTMENT" },
  { longName: "Academy of Classical and Folk Arts", shortCode: "ACFA", type: "ACADEMY" },
  { longName: "Aditya Choubey Center for Re-Water Research", shortCode: "ACCR", type: "CENTRE" },
  { longName: "CENTRE FOR COMPUTATIONAL AND DATA SCIENCES", shortCode: "CCDS", type: "CENTRE" },
  { longName: "Centre for Interdisciplinary and Convergent Technologies", shortCode: "CICT", type: "CENTRE" },
  { longName: "Centre for Ocean, River, Atmosphere and Land Sciences (CORAL)", shortCode: "CORAL", type: "CENTRE" },
  { longName: "Centre for Rural Development and Innovative Sustainable Technology", shortCode: "CRDIST", type: "CENTRE" },
  { longName: "Centre for Sustainable and Community Development", shortCode: "CSCD", type: "CENTRE" },
  { longName: "Centre for Teaching Learning and Virtual Skilling", shortCode: "CTLVS", type: "CENTRE" },
  { longName: "CENTRE FOR THEORETICAL STUDIES", shortCode: "CTS", type: "CENTRE" },
  { longName: "Centre of Excellence for Indian Knowledge Systems", shortCode: "CEIKS", type: "CENTRE" },
  { longName: "Centre of Excellence in Advanced Manufacturing Technology", shortCode: "CEAMT", type: "CENTRE" },
  { longName: "Centre of Excellence in Affordable Healthcare", shortCode: "CEAH", type: "CENTRE" },
  { longName: "Centre of Excellence in Precision Agriculture & Food Nutrition", shortCode: "CEPAFN", type: "CENTRE" },
  { longName: "Centre of Excellence in Public Policy, Law and Governance", shortCode: "CEPPLG", type: "CENTRE" },
  { longName: "Centre of Excellence in Sustainable Development", shortCode: "CESD", type: "CENTRE" },
  { longName: "Centre of Excellence in Urban Planning and Design", shortCode: "CEUPD", type: "CENTRE" },
  { longName: "Centre of Excellence on Safety Engineering & Analytics (COE-SEA)", shortCode: "COESEA", type: "CENTRE" },
  { longName: "Centre of Studies and Research for the Differently-abled", shortCode: "CSRD", type: "CENTRE" },
  { longName: "Centre of Teaching Learning and Educational Technology (CTLET)", shortCode: "CTLET", type: "CENTRE" },
  { longName: "CRYOGENIC ENGINEERING", shortCode: "CRYO", type: "CENTRE" },
  { longName: "DEYSARKAR CENTRE OF EXCELLENCE IN PETROLEUM ENGINEERING", shortCode: "DCEPE", type: "CENTRE" },
  { longName: "Dr B C Roy Multi Speciality Medical Research Centre", shortCode: "BCR", type: "CENTRE" },
  { longName: "ENERGY SCIENCE AND ENGINEERING", shortCode: "ES", type: "SCHOOL" },
  { longName: "ENVIRONMENTAL SCIENCE AND ENGINEERING", shortCode: "EVS", type: "SCHOOL" },
  { longName: "EXTRA ACADEMIC(NCC,NSS,NSO)", shortCode: "EAA", type: "OTHER" },
  { longName: "Geospatial Academy", shortCode: "GA", type: "ACADEMY" },
  { longName: "G.S Sanyal School of Telecommunication", shortCode: "GSST", type: "SCHOOL" },
  { longName: "Manekshaw Center of Excellence for National Security Studies and Research", shortCode: "MCENSSR", type: "CENTRE" },
  { longName: "MATERIALS SCIENCE CENTRE", shortCode: "MSC", type: "CENTRE" },
  { longName: "M. N. Faruqi Centre for Innovation", shortCode: "MNFCI", type: "CENTRE" },
  { longName: "NANO SCIENCE AND TECHNOLOGY", shortCode: "NST", type: "SCHOOL" },
  { longName: "Partha Ghosh School of Leadership", shortCode: "PGSL", type: "SCHOOL" },
  { longName: "P.K. Sinha Centre for Bioenergy and Renewables", shortCode: "PKSCBR", type: "CENTRE" },
  { longName: "PREPARATORY", shortCode: "PREP", type: "OTHER" },
  { longName: "RAJENDRA MISHRA SCHOOL OF ENGG ENTREPRENEURSHIP", shortCode: "RMSEE", type: "SCHOOL" },
  { longName: "RAJIV GANDHI SCHOOL OF INTELLECTUAL PROPERTY LAW", shortCode: "RGSOIPL", type: "SCHOOL" },
  { longName: "RANBIR & CHITRA GUPTA SCHOOL OF INFRASTRUCTURE DESIGN & MANAGEMENT", shortCode: "RCGSIDM", type: "SCHOOL" },
  { longName: "Rekhi Centre of Excellence for the Science of Happiness", shortCode: "RCESH", type: "CENTRE" },
  { longName: "RUBBER TECHNOLOGY", shortCode: "RT", type: "CENTRE" },
  { longName: "SCHOOL OF MEDICAL SCIENCE & TECHNOLOGY", shortCode: "SMST", type: "SCHOOL" },
  { longName: "SCHOOL OF WATER RESOURCES", shortCode: "SWR", type: "SCHOOL" },
  { longName: "Steel Technology Centre", shortCode: "STC", type: "CENTRE" },
  { longName: "Subir Chowdhury School of Quality and Reliability", shortCode: "SCSQR", type: "SCHOOL" },
  { longName: "VINOD GUPTA SCHOOL OF MANAGEMENT", shortCode: "VGSOM", type: "SCHOOL" },
];

const seedDepartments = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log("Connected to database.");

    for (const data of departmentsData) {
      await Department.findOneAndUpdate(
        { shortCode: data.shortCode },
        data,
        { upsert: true, new: true }
      );
    }
    
    console.log("Departments seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding departments:", error);
    process.exit(1);
  }
};

seedDepartments();
