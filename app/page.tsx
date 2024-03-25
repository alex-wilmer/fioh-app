import Image from "next/image";
import styles from "./page.module.css";
import UploadImage from "~/components/UploadImage";

export default function Home() {
  return (
    <main className={styles.main}>
      <UploadImage />
    </main>
  );
}
