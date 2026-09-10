export const siteConfig = {
  businessName: "Nuvola Home",
  legalName: "Nuvola Home LLC",
  tagline: "Contemporary furniture for considered living.",
  description:
    "A curated destination for contemporary furniture in Miami, bringing sculptural form, natural materials, and everyday comfort together.",
  url: "https://nuvola-home.com",
  address: {
    street: "8217 Biscayne Boulevard",
    city: "Miami",
    region: "FL",
    postalCode: "33138",
    country: "USA",
    countryCode: "US",
  },
  phone: null as string | null,
  email: null as string | null,
  whatsapp: null as string | null,
  openingHours: [
    { day: "Monday", hours: "10:00 AM - 6:00 PM", opens: "10:00", closes: "18:00" },
    { day: "Tuesday", hours: "10:00 AM - 6:00 PM", opens: "10:00", closes: "18:00" },
    { day: "Wednesday", hours: "10:00 AM - 6:00 PM", opens: "10:00", closes: "18:00" },
    { day: "Thursday", hours: "10:00 AM - 6:00 PM", opens: "10:00", closes: "18:00" },
    { day: "Friday", hours: "10:00 AM - 6:00 PM", opens: "10:00", closes: "18:00" },
    { day: "Saturday", hours: "10:00 AM - 6:00 PM", opens: "10:00", closes: "18:00" },
    { day: "Sunday", hours: "12:00 PM - 5:00 PM", opens: "12:00", closes: "17:00" },
  ],
  social: {
    instagram: null as string | null,
    facebook: null as string | null,
    pinterest: null as string | null,
  },
  directionsUrl:
    "https://www.google.com/maps/search/?api=1&query=8217+Biscayne+Boulevard+Miami+FL+33138",
} as const;

export const formattedAddress = `${siteConfig.address.street}, ${siteConfig.address.city}, ${siteConfig.address.region} ${siteConfig.address.postalCode}`;
