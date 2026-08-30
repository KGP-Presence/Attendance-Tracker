const INSTITUTE_EMAIL_DOMAIN = "iitkgp.ac.in";

// Matches institute mail ids like abc@iitkgp.ac.in and abc@kgpian.iitkgp.ac.in
const INSTITUTE_EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)*iitkgp\.ac\.in$/i;

const isInstituteEmail = (email) =>
  typeof email === "string" && INSTITUTE_EMAIL_REGEX.test(email.trim());

export { INSTITUTE_EMAIL_DOMAIN, INSTITUTE_EMAIL_REGEX, isInstituteEmail };
