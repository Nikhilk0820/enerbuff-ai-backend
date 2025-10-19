const mapHistoryRow = (row) => ({
  ...row,
  triggeredAt:
    row.triggeredAt instanceof Date
      ? row.triggeredAt.toISOString()
      : row.triggeredAt,
});

module.exports = { mapHistoryRow };
