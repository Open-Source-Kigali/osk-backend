import { prisma } from "../config/prisma";
import { Event, Prisma } from "../generated/prisma/client";

// Public event responses should not leak the backing Cloudinary identifier.
const eventSafeSelect = {
  id: true,
  title: true,
  tagline: true,
  imageUrl: true,
  description: true,
  category: true,
  mode: true,
  featured: true,
  capacity: true,
  registered: true,
  date: true,
  endDate: true,
  timeLabel: true,
  location: true,
  speakers: true,
  registerUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EventSelect;

async function findAllEvents(featured?: boolean) {
  return prisma.event.findMany({
    where: featured !== undefined ? { featured } : undefined,
    orderBy: { date: "asc" },
    select: eventSafeSelect,
  });
}

async function findEventByIdSafe(id: string) {
  return prisma.event.findUnique({ where: { id }, select: eventSafeSelect });
}

async function addEvent(
  eventData: Omit<Event, "id" | "createdAt" | "updatedAt">,
) {
  return prisma.event.create({ data: eventData, select: eventSafeSelect });
}

async function findEventById(id: string) {
  return prisma.event.findUnique({ where: { id } });
}

async function updateEvent(id: string, eventData: Prisma.EventUpdateInput) {
  return prisma.event.update({
    where: { id },
    data: eventData,
    select: eventSafeSelect,
  });
}

async function deleteEvent(id: string) {
  return prisma.event.delete({ where: { id } });
}

export default {
  findAllEvents,
  findEventByIdSafe,
  addEvent,
  findEventById,
  updateEvent,
  deleteEvent,
};
