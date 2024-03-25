import React, { useState } from "react";
import Box from "@mui/material/Box";
import { Button } from "@mui/material";

export default function UploadImage({
  clearDataUrl = () => {},
  dataUrl,
  imageSize,
  uploadFile,
  uploadToImgur = () => {},
}: {
  clearDataUrl?: Function;
  dataUrl?: string | ArrayBuffer | null;
  imageSize: { width: number; height: number } | null;
  uploadFile: React.ChangeEventHandler<HTMLInputElement>;
  uploadToImgur?: Function;
}) {
  const [caption, setCaption] = useState("");
  return (
    <div>
      {!!dataUrl || (
        <form
          style={{
            display: `flex`,
            justifyContent: `center`,
          }}
        >
          <div
            className="file"
            style={{
              margin: `2rem 0`,
            }}
          >
            <Button variant="contained" component="label">
              Upload Image
              <input
                hidden
                type="file"
                name="imageFile"
                onChange={uploadFile}
                style={{
                  height: `100%`,
                  width: `100%`,
                }}
              />
            </Button>
          </div>
        </form>
      )}
      {!!dataUrl && (
        <div
          style={{
            display: `flex`,
            flexDirection: `column`,
            justifyContent: `center`,
          }}
        >
          {!!dataUrl && (
            <div>
              <img // eslint-disable-line
                alt="dataUrl"
                // todo this type is fucked
                // @ts-ignore
                src={dataUrl}
                style={{
                  maxWidth: `40rem`,
                }}
              />
            </div>
          )}
          <div
            style={{
              margin: `1rem 0`,
            }}
          >
            <div
              style={{
                marginBottom: `1rem`,
              }}
            >
              {imageSize?.width}px - {imageSize?.height}px
            </div>

            <label
              style={{
                fontSize: `1.1rem`,
                display: `block`,
                marginBottom: `0.5rem`,
              }}
            >
              Figure caption:
            </label>

            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={10}
                style={{
                  marginBottom: `1rem`,
                  height: `8rem`,
                }}
              />

              <Box>
                <Button onClick={() => clearDataUrl(null)}>Cancel</Button>
                <Button
                  onClick={() => uploadToImgur({ caption: caption || "" })}
                  style={{
                    marginLeft: `3rem`,
                  }}
                >
                  Save
                </Button>
              </Box>
            </Box>
          </div>
        </div>
      )}
    </div>
  );
}
