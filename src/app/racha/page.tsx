import { Suspense } from "react";
import RachaDetailClient from "./RachaDetailClient";
import styles from "./page.module.css";

export default function RachaPage() {
  return (
    <Suspense fallback={<div className={styles.container} />}>
      <RachaDetailClient />
    </Suspense>
  );
}
