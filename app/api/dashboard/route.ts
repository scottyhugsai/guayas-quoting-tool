import { NextResponse } from 'next/server';
import { getPool, ensureInit } from '@/lib/db';

export async function GET() {
  try {
    await ensureInit();
    const pool = getPool();
    const [jobs, quotes, invoices, claims] = await Promise.all([
      pool.query(`SELECT stage, job_value FROM jobs`),
      pool.query(`SELECT status, grand_total, total FROM quotes`),
      pool.query(`SELECT status, amount FROM invoices`),
      pool.query(`SELECT status FROM insurance_claims`),
    ]);

    const monthlyRevenue = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', paid_at), 'Mon') AS month,
        EXTRACT(YEAR FROM paid_at) AS year,
        EXTRACT(MONTH FROM paid_at) AS month_num,
        SUM(amount) AS revenue
      FROM invoices
      WHERE status = 'paid' AND paid_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', paid_at)
      ORDER BY DATE_TRUNC('month', paid_at) ASC
    `);

    const pipelineValue = jobs.rows.reduce((s: number, j: { stage: string; job_value: number }) =>
      ['won', 'in_production', 'negotiating'].includes(j.stage) ? s + Number(j.job_value) : s, 0);

    const totalInvoiced = invoices.rows.reduce((s: number, i: { status: string; amount: number }) =>
      i.status !== 'draft' ? s + Number(i.amount) : s, 0);

    const totalPaid = invoices.rows.reduce((s: number, i: { status: string; amount: number }) =>
      i.status === 'paid' ? s + Number(i.amount) : s, 0);

    return NextResponse.json({
      pipeline_value: pipelineValue,
      total_jobs: jobs.rows.length,
      open_quotes: quotes.rows.filter((q: { status: string }) => q.status === 'draft' || q.status === 'sent').length,
      total_invoiced: totalInvoiced,
      total_paid: totalPaid,
      open_claims: claims.rows.filter((c: { status: string }) => c.status !== 'closed' && c.status !== 'denied').length,
      monthly_revenue: monthlyRevenue.rows.map((r: { month: string; revenue: string }) => ({
        month: r.month,
        revenue: Number(r.revenue),
      })),
      jobs_by_stage: jobs.rows.reduce((acc: Record<string, number>, j: { stage: string }) => {
        acc[j.stage] = (acc[j.stage] || 0) + 1;
        return acc;
      }, {}),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
