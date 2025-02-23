import {
  getAlleKategorien,
  standardKategorien,
} from "../src/services/BuchungskategorieService";
import { prefillDB } from "../src/prefill";
import {
  getAlleBuchungenBenutzer,
  getAlleWiederkehrendeBuchungen,
} from "../src/services/BuchungService";
import { getAllePockets } from "../src/services/PocketService";
import { getAllNotifications } from "../src/services/NotificationService";

test("test prefilldb", async () => {
  const benutzer = await prefillDB();
  expect(benutzer).toBeDefined();

  const pockets = await getAllePockets(benutzer.id!);
  expect(pockets).toBeDefined();
  expect(pockets.length).toBe(3);

  const kategorien = await getAlleKategorien(benutzer.id!);
  expect(kategorien).toBeDefined();
  expect(kategorien.length).toBe(standardKategorien.length + 2);

  const buchungen = await getAlleBuchungenBenutzer(benutzer.id!);
  expect(buchungen).toBeDefined();
  expect(buchungen.length).toBe(11);

  const wiederkehrendeBuchungen = await getAlleWiederkehrendeBuchungen(benutzer.id!);
  expect(wiederkehrendeBuchungen).toBeDefined();
  expect(wiederkehrendeBuchungen.length).toBe(5);

  const notifications = await getAllNotifications(benutzer.id!);
  expect(notifications).toBeDefined();
  expect(notifications.length).toBe(1);
});
