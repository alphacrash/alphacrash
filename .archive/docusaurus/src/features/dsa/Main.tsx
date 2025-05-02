import { Collection } from "@site/src/types";
import ProblemList from "./components/ProblemList";
import { problems } from "./data";

const Main = ({ collection }: { collection: Collection }) => (
  <ProblemList problems={problems} collection={collection} />
);

export default Main;
