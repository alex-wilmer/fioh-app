"use client";

import { useState } from "react";
import removeBackground from "@imgly/background-removal";
import styles from "./page.module.css";
import UploadImage from "~/components/UploadImage";

const CLIENT_ID = "0811fdfd7496d7e";

export default function App() {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState();

  const [linkToRemoveBG, setLinkToRemoveBG] = useState(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [dataUrl, setDataUrl] = useState<
    string | ArrayBuffer | null | undefined
  >(null);
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // todo: figure out type
  // @ts-ignore
  function uploadFile(event) {
    let files = event.target.files;

    if (!files.length) {
      return console.log(`no file chosen`);
    }

    let file = files[0];
    let fileReader = new FileReader();
    // todo find out type
    // @ts-ignore
    let img = new window.Image();
    let _URL = window.URL || window.webkitURL;
    img.src = _URL.createObjectURL(file);

    fileReader.onload = (event) => {
      let dataUrl = event.target?.result;
      setDataUrl(() => dataUrl);
      setImageSize(() => ({
        width: img.naturalWidth,
        height: img.naturalHeight,
      }));
    };

    fileReader.readAsDataURL(file);
  }

  async function uploadToImgur({ caption }: { caption: string }) {
    if (!dataUrl) throw Error("dataurl non-existant or malformed");

    const format = (s: string | ArrayBuffer) => {
      // todo this type needs to be refined
      // @ts-ignore
      const [type, ...data] = s.split(",");
      return data.join();
    };

    setLoading(true);

    const response = await fetch(`https://api.imgur.com/3/image`, {
      method: `POST`,
      headers: {
        Authorization: `Client-ID ${CLIENT_ID}`,
        Accept: `application/json`,
        "Content-Type": `application/json`,
      },
      body: JSON.stringify({
        image: format(dataUrl),
        type: `base64`,
      }),
    });

    const { data } = await response.json();

    if (data.link) {
      setLinkToRemoveBG(data);
    }

    // if (data.link) {
    // setDataUrl(null);

    // saveToDb({
    //   link: data.link,
    //   width: data.width,
    //   height: data.height,
    //   caption,
    // });
    // }
  }

  async function load(image) {
    // setIsRunning(true);
    // resetTimer();
    setImageUrl(image);

    console.log("wat");

    const imageBlob = await removeBackground(image);
    //   debug: true,
    //   progress: (key, current, total) => {
    //     const [type, subtype] = key.split(":");
    //     setCaption(
    //       `${type} ${subtype} ${((current / total) * 100).toFixed(0)}%`
    //     );
    //   },
    // });

    const url = URL.createObjectURL(imageBlob);

    setImageUrl(url);
    // setIsRunning(false);
    // stopTimer();
  }

  return (
    <main className={styles.main}>
      {!!linkToRemoveBG && (
        <div>
          <img src={imageUrl as string} className="App-logo" alt="logo" />
          <button onClick={() => load(linkToRemoveBG)}>Click me</button>
        </div>
      )}
      {!linkToRemoveBG && (
        <UploadImage
          dataUrl={dataUrl}
          imageSize={imageSize}
          uploadFile={uploadFile}
          uploadToImgur={uploadToImgur}
          clearDataUrl={() => setDataUrl(null)}
        />
      )}
      {}
    </main>
  );
}
