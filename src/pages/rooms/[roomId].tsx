import React, { useMemo } from "react";
import { useSubscribeDocument } from "@/util/firestore-hooks";
import { doc } from "@firebase/firestore";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { Chat } from "@/feature/chat";
import { getCollectionRef } from "@/models/util";
import { appNameSpace } from "@/lib/firestore";
import { storePathMap } from "@/models/path";

type Props = {
  roomId: string;
};

const RoomPage = ({ roomId }: Props) => {
  const memorizedGetRoomCollection = useMemo(() => doc(getCollectionRef(appNameSpace,storePathMap,"rooms"), roomId), [roomId]);
  const room = useSubscribeDocument(memorizedGetRoomCollection);

  switch (room.status) {
    case "loading":
      return <p>Loading...</p>;
    case "error":
    case "not-found":
      return <p>Error occurred.</p>;
    default:
      return (
        <div>
          <h1>{room.data.scenario.title}</h1>
          <p>{room.data.createdAt.toString()}</p>
          <Chat roomId={roomId} scenario={room.data.scenario} />
        </div>
      );
  }
};

export const getServerSideProps: GetServerSideProps<Props> = async (context: GetServerSidePropsContext) => {
  const roomId = context.params?.roomId as string;

  if (!roomId) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      roomId,
    },
  };
};

export default RoomPage;
