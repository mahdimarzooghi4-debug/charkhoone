type LeaseContractCardProps = {
  title: string;
  startDate: string;
};

export function LeaseContractCard({ title, startDate }: LeaseContractCardProps) {
  return (
    <div className="ch-contract-card" data-node-id="35:206">
      <div className="ch-contract-card__content" data-node-id="35:208">
        <p className="ch-contract-card__title" data-node-id="35:209">
          {title}
        </p>
        <p className="ch-contract-card__meta" data-node-id="35:210">
          تاریخ شروع: {startDate}
        </p>
      </div>
      <span className="ch-contract-card__chevron" aria-hidden="true" data-node-id="35:207">
        ‹
      </span>
    </div>
  );
}
