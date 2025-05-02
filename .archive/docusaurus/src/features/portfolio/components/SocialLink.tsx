import Link from "@docusaurus/Link";
import { ArrowUpRight } from "lucide-react";

const SocialLink = ({ url, name }) => {
  return (
    <Link href={url} className="flex items-center">
      <span className="flex items-center">
        {name}
        <ArrowUpRight size="16px" />
      </span>
    </Link>
  );
};

export default SocialLink;
