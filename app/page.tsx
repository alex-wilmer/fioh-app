/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Box, LinearProgress, Button, TextField } from "@mui/material";
import removeBackground from "@imgly/background-removal";
import { canvasPreview } from "./canvasPreview";
import { useDebounceEffect } from "./useDebounceEffect";

import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "~/app/api/uploadthing/core";

// This is to demonstate how to make and center a % aspect crop
// which is a bit trickier so we use some helper functions.
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export default function App() {
  const [imgSrc, setImgSrc] = useState("");
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const hiddenAnchorRef = useRef<HTMLAnchorElement>(null);
  const blobUrlRef = useRef("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  // 16 / 9
  const [aspect, setAspect] = useState<number | undefined>(undefined);

  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [removingBG, setRemovingBG] = useState(false);

  const [file, setFile] = useState<File | null>(null);

  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileUpload = useRef(null);

  const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();

  const [email, setEmail] = useState("");

  const { startUpload, routeConfig } = useUploadThing("imageUploader", {
    onClientUploadComplete: () => {
      // alert("uploaded successfully!");
      setUploadSuccess(true);
      setRemovingBG(false);
    },
    onUploadError: () => {
      // alert("error occurred while uploading");
    },
    onUploadBegin: () => {
      setRemovingBG(true);
    },
  });

  const handleUpload = () => {
    // @ts-ignore
    fileUpload.current.click();
  };

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImgSrc(reader.result?.toString() || "")
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const newCrop = centerAspectCrop(width, height, 16 / 9);
    setCrop(newCrop);
  }

  async function onDownloadCropClick() {
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;

    if (!image || !previewCanvas || !completedCrop) {
      setRemovingBG(false);
      throw new Error("Crop canvas does not exist");
    }

    // Ensure cropping is done based on the natural size of the image
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const maxWidth = 1200; // Define a maximum width for the image
    const maxHeight = 1200; // Define a maximum height for the image

    let cropWidth = completedCrop.width * scaleX;
    let cropHeight = completedCrop.height * scaleY;

    // Scale down if the cropped dimensions exceed the max dimensions
    if (cropWidth > maxWidth || cropHeight > maxHeight) {
      const aspectRatio = cropWidth / cropHeight;

      if (cropWidth > maxWidth) {
        cropWidth = maxWidth;
        cropHeight = maxWidth / aspectRatio;
      }

      if (cropHeight > maxHeight) {
        cropHeight = maxHeight;
        cropWidth = maxHeight * aspectRatio;
      }
    }

    const offscreen = new OffscreenCanvas(cropWidth, cropHeight);
    const ctx = offscreen.getContext("2d");

    if (!ctx) {
      setRemovingBG(false);
      throw new Error("No 2d context");
    }

    // ctx.drawImage(
    //   image, // Use the image itself, not the preview canvas
    //   completedCrop.x * scaleX, // Crop area x-coordinate
    //   completedCrop.y * scaleY, // Crop area y-coordinate
    //   cropWidth, // Scaled width
    //   cropHeight, // Scaled height
    //   0, // Destination x-coordinate
    //   0, // Destination y-coordinate
    //   cropWidth, // Final cropped width
    //   cropHeight // Final cropped height
    // );

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      cropWidth,
      cropHeight
    );

    let blob = await offscreen.convertToBlob({
      type: "image/png", // You can switch to "image/png" if needed
    });

    console.log(`Blob size: ${blob.size} bytes`);

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    const url = URL.createObjectURL(blob);
    setImageUrl(url);

    const file = new File([blob], "temp", {
      type: blob.type,
    });

    console.log(file);
    setFile(file);
  }

  useDebounceEffect(
    async () => {
      if (
        completedCrop?.width &&
        completedCrop?.height &&
        imgRef.current &&
        previewCanvasRef.current
      ) {
        // We use canvasPreview as it's much faster than imgPreview.
        canvasPreview(
          imgRef.current,
          previewCanvasRef.current,
          completedCrop,
          scale,
          rotate
        );
      }
    },
    100,
    [completedCrop, scale, rotate]
  );

  // function handleToggleAspectClick() {
  //   if (aspect) {
  //     setAspect(undefined);
  //   } else {
  //     setAspect(16 / 9);

  //     if (imgRef.current) {
  //       const { width, height } = imgRef.current;
  //       const newCrop = centerAspectCrop(width, height, 16 / 9);
  //       setCrop(newCrop);
  //       // Updates the preview
  //       setCompletedCrop(convertToPixelCrop(newCrop, width, height));
  //     }
  //   }
  // }

  return (
    <div
      className={`App ${imgSrc ? "modal" : ""}`}
      onClick={() => {
        if (!imgSrc) handleUpload();
      }}
    >
      <input
        ref={fileUpload}
        type="file"
        accept="image/*"
        onChange={onSelectFile}
        style={{ opacity: 0, position: "absolute" }}
      />
      {/* <div className="Crop-Controls"> */}
      {/* <div>
          <label htmlFor="scale-input">Scale: </label>
          <input
            id="scale-input"
            type="number"
            step="0.1"
            value={scale}
            disabled={!imgSrc}
            onChange={(e) => setScale(Number(e.target.value))}
          />
        </div> */}
      {/* <div>
          <label htmlFor="rotate-input">Rotate: </label>
          <input
            id="rotate-input"
            type="number"
            value={rotate}
            disabled={!imgSrc}
            onChange={(e) =>
              setRotate(Math.min(180, Math.max(-180, Number(e.target.value))))
            }
          />
        </div> */}
      {/* <div>
          <button onClick={handleToggleAspectClick}>
            Toggle aspect {aspect ? "off" : "on"}
          </button>
        </div> */}
      {/* </div> */}
      {imageUrl && (
        <div className="crop-container">
          {uploadSuccess && (
            <Box>Thank you for sending your picture to FIOH!</Box>
          )}

          {!uploadSuccess && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                alignItems: "center",
              }}
            >
              <img
                className="cropped-img"
                src={imageUrl as string}
                alt="logo"
              />

              <Box>Please enter your email! (optional)</Box>

              <TextField
                className="email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                sx={{
                  border: "1px solid #fff",
                  mx: "15px",
                  "& .MuiInputBase-input": {
                    color: "#fff",
                  },
                }}
              />

              <Box
                sx={{ mt: "15px", display: "flex", justifyContent: "center" }}
              >
                <Button
                  onClick={() => {
                    if (file) {
                      const currentDate = new Date();
                      const formattedDate = `${currentDate.getDate()}-${currentDate.getHours()}-${currentDate.getMinutes()}`;
                      const myNewFile = new File(
                        [file],
                        `${email || "image"}-${formattedDate}.png`,
                        {
                          type: file.type,
                        }
                      );
                      startUpload([myNewFile]);
                    }
                  }}
                  variant="contained"
                >
                  UPLOAD
                </Button>
              </Box>
            </Box>
          )}
        </div>
      )}
      {removingBG && (
        <div style={{ position: "absolute", top: 0, width: "100%" }}>
          <LinearProgress />
        </div>
      )}
      {!!imgSrc && !imageUrl && (
        <div className="crop-container">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => {
              setCrop(percentCrop);
            }}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            // minWidth={400}
            minHeight={100}
            // circularCrop
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imgSrc}
              style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>
      )}
      {!!completedCrop && !imageUrl && (
        <>
          <canvas
            ref={previewCanvasRef}
            style={{
              display: "none",
              border: "1px solid black",
              objectFit: "contain",
              width: completedCrop.width,
              height: completedCrop.height,
            }}
          />
          <div>
            <Button onClick={onDownloadCropClick} variant="contained">
              Crop
            </Button>
            <a
              href="#hidden"
              ref={hiddenAnchorRef}
              download
              style={{
                position: "absolute",
                top: "-200vh",
                visibility: "hidden",
              }}
            >
              Hidden download
            </a>
          </div>
        </>
      )}
    </div>
  );
}
