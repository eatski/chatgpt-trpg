import React, { useMemo } from "react";
import { useSubscribeDocument } from "@/util/firestore-hooks";
import { doc } from "@firebase/firestore";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { Session } from "@/features/session";
import { getCollectionRef } from "@/lib/firestore";

type Props = {
  roomId: string;
};

const RoomPage = ({ roomId }: Props) => {
  const memorizedGetRoomCollection = useMemo(() => doc(getCollectionRef("rooms"), roomId), [roomId]);
  const room = useSubscribeDocument(memorizedGetRoomCollection);

  switch (room.status) {
    case "loading":
      return <p>Loading...</p>;
    case "error":
    case "not-found":
      return <p>Error occurred.</p>;
    default:
      return (
        <Session roomId={roomId} scenario={room.data.scenario} />
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
