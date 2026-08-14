export const CORE_CHURCH_DEPARTMENTS = [
  {
    key: "sabbath_school",
    name: "Sabbath School",
    code: "SABBATH_SCHOOL",
    description: "Bible study, Sabbath School classes, lesson coordination, spiritual growth, and member participation.",
    aliases: [],
  },
  {
    key: "children",
    name: "Children’s Ministries",
    code: "CHILDRENS_MINISTRIES",
    description: "Spiritual development, programs, activities, safety, and support for children.",
    aliases: ["Children's Ministries", "Children's Department", "Children Department", "Children's Ministry", "Children Ministry"],
  },
  {
    key: "adventist_youth",
    name: "Adventist Youth Ministries",
    code: "ADVENTIST_YOUTH",
    description: "Youth worship, fellowship, leadership development, outreach, training, and activities.",
    aliases: ["Youth Ministry", "Youth Ministries"],
  },
  {
    key: "personal_ministries",
    name: "Personal Ministries and Evangelism",
    code: "PERSONAL_MINISTRIES",
    description: "Personal outreach, Bible studies, visitation, evangelism, discipleship, and community mission.",
    aliases: ["Personal Ministries", "Evangelism Ministry"],
  },
  {
    key: "deacons",
    name: "Deacon and Deaconess Ministry",
    code: "DEACON_DEACONESS",
    description: "Supporting worship services, ordinances, church facilities, visitation, member care, and practical church needs.",
    aliases: ["Deacons Department", "Deacon Ministry", "Deaconess Ministry"],
  },
  {
    key: "media",
    name: "Media and Communications",
    code: "MEDIA_COMMUNICATIONS",
    description: "Livestreaming, photography, sound, projection, social media, announcements, and church communication.",
    aliases: ["Media Department", "Media Ministry", "Communications Ministry"],
  },
  {
    key: "music_ministry",
    name: "Music Ministry",
    code: "MUSIC_MINISTRY",
    description: "Choirs, praise teams, instrumental music, worship music, rehearsals, and service coordination.",
    aliases: ["Music Department"],
  },
  {
    key: "health_ministries",
    name: "Health Ministries",
    code: "HEALTH_MINISTRIES",
    description: "Health education, wellness programs, healthy living, community health outreach, and member support.",
    aliases: ["Health Ministry", "Health Department"],
  },
  {
    key: "family_ministries",
    name: "Family Ministries",
    code: "FAMILY_MINISTRIES",
    description: "Supporting marriages, parents, children, families, relationships, and family-life programs.",
    aliases: ["Family Ministry", "Family Life Ministry"],
  },
  {
    key: "community_services",
    name: "Community Services",
    code: "COMMUNITY_SERVICES",
    description: "Compassion ministry, community assistance, relief activities, visitation, and practical outreach.",
    aliases: ["Community Service Ministry"],
  },
  {
    key: "womens_ministries",
    name: "Women’s Ministries",
    code: "WOMENS_MINISTRIES",
    description: "Spiritual growth, fellowship, mentorship, service, training, and support for women.",
    aliases: ["Women's Ministries", "Women's Ministry", "Women Ministry"],
  },
  {
    key: "education_ministry",
    name: "Education Ministry",
    code: "EDUCATION_MINISTRY",
    description: "Supporting Christian education, students, teachers, schools, scholarships, academic development, and educational programs.",
    aliases: ["Education Department"],
  },
] as const;

export type CoreChurchDepartmentKey = (typeof CORE_CHURCH_DEPARTMENTS)[number]["key"];

export function normalizeDepartmentIdentity(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

export function departmentMatchesCoreTemplate(
  department: { department_name: string; code?: string | null },
  template: (typeof CORE_CHURCH_DEPARTMENTS)[number]
) {
  const names = [template.name, ...template.aliases].map(normalizeDepartmentIdentity);
  return (
    normalizeDepartmentIdentity(department.code) === normalizeDepartmentIdentity(template.code) ||
    names.includes(normalizeDepartmentIdentity(department.department_name))
  );
}
