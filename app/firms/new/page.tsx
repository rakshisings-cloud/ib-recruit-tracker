import Link from "next/link";
import FirmForm from "@/components/FirmForm";

export default function NewFirmPage() {
  return (
    <div className="container">
      <div className="page-header">
        <h1>Add Firm</h1>
        <Link href="/" className="btn">
          Back to Dashboard
        </Link>
      </div>
      <FirmForm />
    </div>
  );
}
