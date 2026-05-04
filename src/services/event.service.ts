import { prisma } from "../config/prisma";
import { Event, Prisma } from "../generated/prisma/client";

async function findAllEvents() {
  return prisma.event.findMany();
}

async function addEvent(
  eventData: Omit<Event, "id" | "createdAt" | "updatedAt">,
) {
  return prisma.event.create({ data: eventData });
}

async function findEventById(id: string) {
  return prisma.event.findUnique({ where: { id } });
}

async function updateEvent(id: string, eventData: Prisma.EventUpdateInput) {
  return prisma.event.update({ where: { id }, data: eventData });
}

async function deleteEvent(id: string) {
  return prisma.event.delete({ where: { id } });
}

export default {
  findAllEvents,
  addEvent,
  findEventById,
  updateEvent,
  deleteEvent,
};
