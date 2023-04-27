import { getCollectionRef } from "@/lib/firestore";
import { Scenario, UserCommand, ChangeScene, SessionEventDone } from "@/models/types";
import { onSnapshot, orderBy, query, QueryDocumentSnapshot } from "@firebase/firestore";
import { resolveChangeScene } from "./changeScene";
import { resolveUserCommand } from "./userCommand";

export const listenToEventsAndResolve = (roomId: string, scenario: Scenario) => {
  const eventsCollectionRef = getCollectionRef(`rooms/${roomId}/events`);
  const eventsQuery = query(eventsCollectionRef, orderBy("createdAt"));
  return onSnapshot(eventsQuery, async (snapshot) => {
    const picked = snapshot.docs.find((item) => item.data().status === "waiting");
    if (!picked) {
      return;
    }
    const history: SessionEventDone[] = [];
    for (const item of snapshot.docs.map((e) => e.data())) {
      if (item.status === "done") {
        history.push(item);
      }
    }
    switch (picked.data().type) {
      case "userCommand":
        await resolveUserCommand(eventsCollectionRef, picked as QueryDocumentSnapshot<UserCommand>, history, scenario);
        break;
      case "changeScene":
        await resolveChangeScene(picked as QueryDocumentSnapshot<ChangeScene>, scenario);
        break;
    }
  });
};
