/**
 * Leadership roster. Shaped like the eventual `Staff` table (id, slug,
 * department, skills) rather than around the About page's card layout, so this
 * becomes a Prisma query without touching the components that read it.
 */
export type Department =
  | "Architectural Council"
  | "Growth Operations"
  | "Creative Engineering"
  | "Core Engineering";

export type TeamMember = {
  id: string;
  slug: string;
  name: string;
  role: string;
  department: Department;
  skills: string[];
  portrait: string;
};

export const departmentTone: Record<Department, string> = {
  // `-subtle` / `-subtle-fg` pairs, not `bg-X/20 text-X`. A colour on a tint of
  // itself lands around 3.4–4.4:1, under the 4.5 these small bold labels need.
  "Architectural Council": "bg-brand-subtle text-brand-subtle-fg",
  "Growth Operations": "bg-ion-subtle text-ion-subtle-fg",
  "Creative Engineering": "bg-chart-3-subtle text-chart-3-subtle-fg",
  "Core Engineering": "bg-chart-4-subtle text-chart-4-subtle-fg",
};

/* TODO: every `portrait` is a design-tool CDN URL and will expire. */
export const leadership: TeamMember[] = [
  {
    id: "alex-vance",
    slug: "alex-vance",
    name: "Alex Vance",
    role: "Principal Architect",
    department: "Architectural Council",
    skills: ["Rust", "WebGL", "Systems"],
    portrait:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDnMMlEYoAjOW_BFOmtMURFOjgSNy9w0mJcROqLUbNb9-SLFwH9j6Ud8ni_1NY3HGX_8pWbkL4V3SvdAGxWv7EWdtuY5Dg57jdvw_9zgrDjnIvkg9VI6vn3Apd6Py9hxKYdlK4j3BZYe1PAlugZvFxvwvgFWV0RnxxoOtvsdR0zPhbOcOPVzlz1b2x8rTvrOUs5JhvJbIocO1K9uBXA_ARssWd7HdEQqViJtBuM8OyaPDaXWqE1v7euCaGSOK7Yx7cl_-t1dROgO8GZ",
  },
  {
    id: "elara-kent",
    slug: "elara-kent",
    name: "Elara Kent",
    role: "Head of Performance",
    department: "Growth Operations",
    skills: ["SEO", "Analytics", "Data"],
    portrait:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuADvJCo7LbMExyTOt-lLkIXzjks4GXXv35_dEfZd011M2AUuU-FrHsokce7I0ZmTDoOAJAS2cDxkeANbIRRIbKkT0Ik9rV2OZtlBMXVBNeTEjMEVIO3AmZjQDtPXihD-2lbXylHlJEet-N2KuO1cUbkgS0j7RnaQTVQpsMshnt8phjQ615-krKWjqd-1M8gyRN5EZOMHl0jOLaz3NWQV1YSbxpiMxUWFR5AnHKKZCirgqZINjaB8GbbuQ8YUTByQzTcxSYil-6kAXbK",
  },
  {
    id: "marcus-thorne",
    slug: "marcus-thorne",
    name: "Marcus Thorne",
    role: "Creative Director",
    department: "Creative Engineering",
    skills: ["Design Sys", "UI/UX", "ThreeJS"],
    portrait:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBAAn96iu6LqGRnL8JKL6bZ_dsgXwi09ITrmZ7bHg89R_LwKkuWAe2WGSonCLGjYKPavMx4XAAiVHhhC5x2Z6sZp8kYmSulS55ioqMsLCHC6Bgr-_aKkySycOjEY1CNecg29OHf4S60fEhXnJlWXg7iZ34b9WLlN8ye9TyujK16d7pzQYzK89ZPBqvg_QRYamkTn0z2cE5vcwWmVP1dugSJmPm_0wMeihLUy6ACqkr4zfXKARt_iH60qjG_x7aVBZ6SHVTfd-xYcT6q",
  },
  {
    id: "sarah-chen",
    slug: "sarah-chen",
    name: "Sarah Chen",
    role: "VP of Engineering",
    department: "Core Engineering",
    skills: ["Cloud", "Security", "DevOps"],
    portrait:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBjBLX8xhzDWj-useLF_cSGrrZyKLLgKDQPZ4J6sJfZT10CtIU_8Le6vYGnFTjKoZTNimLbUbOoRn5-UyVl0YBqs2fMUkrcTk816PzyqvvYmhLHHWp_tnt0tfebNgbvKllO2-nlrs28A__K0nuefz7k3O0XtU8xEcPKCxsW0kfh015BHWoLM9jExB7fX7V5JbB7a3vL4WOzEjGioDy6lMOiYnv0N-SbBXj-DZoXiLKfKEXq244GnanZJw8aYAWHaD-0zwRAtKezpqQ6",
  },
];
