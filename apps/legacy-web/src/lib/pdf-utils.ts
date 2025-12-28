import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateWorkOrderPDF = async (workOrder: any, tenant: any) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Create a temporary container for the report
    const element = document.createElement('div');
    element.style.padding = '40px';
    element.style.width = '210mm'; // A4 width
    element.style.background = '#ffffff';
    element.style.color = '#333333';
    element.style.fontFamily = 'sans-serif';
    element.style.position = 'absolute';
    element.style.left = '-9999px';

    const logoUrl = tenant?.theme_json?.branding?.logoUrl;

    element.innerHTML = `
        <div style="border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: start;">
            <div>
                ${logoUrl ? `<img src="${logoUrl}" style="height: 50px; margin-bottom: 10px;" />` : `<h1 style="margin: 0; color: #f97316;">WorkOrderPro</h1>`}
                <h2 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Work Order Report</h2>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">ID: ${workOrder.id}</p>
            </div>
            <div style="text-align: right;">
                <p style="margin: 0; font-weight: bold; font-size: 14px;">${tenant?.name || 'Authorized Fleet Ops'}</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">Generated: ${new Date().toLocaleString()}</p>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
            <div>
                <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px; text-transform: uppercase; font-size: 12px; color: #999;">Assignment Details</h3>
                <p><strong>Title:</strong> ${workOrder.title}</p>
                <p><strong>Status:</strong> <span style="text-transform: uppercase;">${workOrder.status}</span></p>
                <p><strong>Priority:</strong> <span style="text-transform: uppercase;">${workOrder.priority}</span></p>
                <p><strong>Created:</strong> ${new Date(workOrder.created_at).toLocaleDateString()}</p>
            </div>
            <div>
                <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px; text-transform: uppercase; font-size: 12px; color: #999;">Personnel</h3>
                <p><strong>Assigned To:</strong> ${workOrder.assigned_to?.full_name || 'Unassigned'}</p>
                ${workOrder.completed_by ? `<p><strong>Completed By:</strong> ${workOrder.completed_by.full_name}</p>` : ''}
            </div>
        </div>

        <div style="margin-bottom: 40px;">
            <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px; text-transform: uppercase; font-size: 12px; color: #999;">Directives & Description</h3>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; font-size: 14px; line-height: 1.6;">
                ${workOrder.description || 'No description provided.'}
            </div>
        </div>

        ${workOrder.status === 'completed' ? `
            <div style="margin-bottom: 40px;">
                <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px; text-transform: uppercase; font-size: 12px; color: #999;">Completion Intelligence</h3>
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; font-size: 14px; line-height: 1.6; border-left: 4px solid #16a34a;">
                    ${workOrder.completion_notes || 'No completion notes.'}
                </div>
            </div>
            <div style="margin-top: 60px; display: flex; justify-content: flex-end;">
                <div style="text-align: right; border-top: 1px solid #ccc; padding-top: 10px; min-width: 250px;">
                    <p style="margin: 0; font-family: 'Dancing Script', cursive; font-size: 24px;">${workOrder.signed_by_name || 'Authorized Signatory'}</p>
                    <p style="margin: 5px 0 0 0; text-transform: uppercase; font-size: 10px; color: #999; letter-spacing: 1px;">Digital Identifier Confirmed</p>
                </div>
            </div>
        ` : ''}

        <div style="position: absolute; bottom: 40px; left: 40px; right: 40px; border-top: 1px solid #eee; padding-top: 10px; font-size: 10px; color: #999; text-align: center;">
            WorkOrderPro Industrial CMMS - Internal Document - Confidential
        </div>
    `;

    document.body.appendChild(element);

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
        });
        const imgData = canvas.toDataURL('image/png');

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        doc.save(`WORK_ORDER_${workOrder.id.slice(0, 8)}_${workOrder.title.replace(/\s+/g, '_').toUpperCase()}.pdf`);
    } catch (err) {
        console.error("PDF Generation failed:", err);
        throw err;
    } finally {
        document.body.removeChild(element);
    }
};
