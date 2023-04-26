import { getCollectionRef } from "@/lib/firestore";
import { Scenario, Event } from "@/models/types";
import { onSnapshot, orderBy, query } from "@firebase/firestore";
import { resolveUserCommand } from "./userCommand";

export const listenToEventsAndResolve = (roomId: string, scenario: Scenario) => {
  const collection = query(getCollectionRef(`rooms/${roomId}/events`), orderBy("createdAt"));
  return onSnapshot(collection, async (snapshot) => {
    const picked = snapshot.docs.find((item) => item.data().status === "waiting");
    if (!picked) {
      return;
    }
    const history: (Event & { status: "done" })[] = [];
    for (const item of snapshot.docs.map((e) => e.data())) {
      if (item.status === "done") {
        history.push(item);
      }
    }
    await resolveUserCommand(picked, history, scenario);
  });
};
