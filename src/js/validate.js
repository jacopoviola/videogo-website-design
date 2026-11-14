/* Shared by the browser form and the Pages Function. The server result is the one that counts. */
export const LIMITS = { name: 80, email: 254, website: 200, message: 1000 };
const EMAIL = /^[^\s@<>"'(),;:\\]+@[^\s@<>"'(),;:\\]+\.[^\s@<>"'(),;:\\]{2,}$/;
const WEBSITE = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(:\d{2,5})?(\/[^\s<>"']*)?$/i;
const CONTROL = /[\x00-\x1F\x7F]/g;

const clean = (v) => (typeof v === "string" ? v.replace(CONTROL, " ").replace(/\s+/g, " ").trim() : "");
const cleanMultiline = (v) => (typeof v === "string" ? v.replace(/\r\n?/g, "\n").replace(/[\x00-\x09\x0B-\x1F\x7F]/g, " ").replace(/\n{3,}/g, "\n\n").trim() : "");

export function validateDemoRequest(input = {}) {
  const values = {
    firstName: clean(input.firstName), lastName: clean(input.lastName), email: clean(input.email).toLowerCase(),
    website: clean(input.website), message: cleanMultiline(input.message),
  };
  const errors = {};
  if (!values.firstName) errors.firstName = "Enter your first name.";
  else if (values.firstName.length > LIMITS.name) errors.firstName = `Keep this under ${LIMITS.name} characters.`;
  if (!values.lastName) errors.lastName = "Enter your last name.";
  else if (values.lastName.length > LIMITS.name) errors.lastName = `Keep this under ${LIMITS.name} characters.`;
  if (!values.email) errors.email = "Enter your work email.";
  else if (values.email.length > LIMITS.email || !EMAIL.test(values.email)) errors.email = "Enter a valid email, like name@business.com.";
  if (values.website && (values.website.length > LIMITS.website || !WEBSITE.test(values.website))) errors.website = "Enter a web address, like yourbusiness.com, or leave this empty.";
  if (values.message.length > LIMITS.message) errors.message = `Keep this under ${LIMITS.message} characters.`;
  return { values, errors, valid: Object.keys(errors).length === 0 };
}
