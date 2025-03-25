import Layout from "@theme/Layout";
import type { ReactNode } from "react";
import Main from "../features/portfolio/Main";

export default function Home(): ReactNode {
  return (
    <Layout description="A portfolio of SUD">
      <Main />
    </Layout>
  );
}
