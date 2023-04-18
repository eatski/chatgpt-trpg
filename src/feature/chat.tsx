import React, { useEffect, useMemo } from "react";
import { Scenario } from "@/models/types";
import { addDoc, onSnapshot, setDoc } from "@firebase/firestore";
import { getCollectionRef } from "@/lib/firestore";
import { useSubscribeCollection } from "@/util/firestore-hooks";
import { openai } from "@/lib/openapi";
import { assistantResponse } from "@/models/schema";

type Props = {
  roomId: string;
  scenario: Scenario;
};

const Chat: React.FC<Props> = ({ roomId, scenario }) => {
  const chatCollection = useMemo(() => getCollectionRef(`rooms/${roomId}/chat`),[roomId]);

  const state = useSubscribeCollection(chatCollection);
  useEffect(() => {
   return onSnapshot(chatCollection, (snapshot)=> {
      const chatNeedRes = snapshot.docs.find(item => !item.data().assistant);
      if(chatNeedRes){
        const chat = chatNeedRes.data();
        openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: scenario.scenes.default.systemPrompt,
            },
            {
              role: "user",
              content: chat.user.message,
            }
          ]
        }).then((res)=>{
          const content = res.data.choices[0].message?.content;
          if(!content){
            throw new Error("error")
          }
          const parsed = JSON.parse(content);
          const assistantRes = assistantResponse.parse(parsed); 
          setDoc(chatNeedRes.ref,{
            user: chat.user,
            assistant: assistantRes
          })
        })
      }
   })
  },[chatCollection,scenario])
  const [input, setInput] = React.useState<string>("");
  return (
    <section>
      <h2>{scenario.title}</h2>
      <p>{scenario.description}</p>
      {
        state.status === "success" ? <code>{JSON.stringify(state.data.docs.map(e => e.data()))}</code> : null
      }
      <div>
      <input onChange={async (e) => {
        setInput(e.target.value);
      }}></input>
      {<button disabled={!input} onClick={() => {
        addDoc(chatCollection, {
          user: {
            userId: "test",
            message: input,
          },
        }).then(() => {
          setInput("");
        })
      }}>送信</button>} 
      </div>
      
    </section>
  );
};

export { Chat };
