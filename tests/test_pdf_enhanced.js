const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:8000/api';

async function testEnhancedPdf() {
    console.log('🧪 Testing Enhanced PDF Generation...');

    // Create dummy resume
    const resumeContent = `
John Smith
Email: john.smith@example.com
Phone: 555-0199

SUMMARY
Experienced developer.

EXPERIENCE
Software Engineer
• Built cool things.
• Optimized performance.

EDUCATION
BS CS
`;
    const resumePath = path.join(__dirname, 'test_resume_enhanced.txt');
    fs.writeFileSync(resumePath, resumeContent);

    try {
        // Upload
        console.log('📤 Uploading resume...');
        const formData = new FormData();
        const file = new Blob([resumeContent], { type: 'text/plain' });
        formData.append('resume', file, 'test_resume_enhanced.txt');
        formData.append('job_title', 'Dev');
        formData.append('company_name', 'Tech');
        formData.append('job_description', 'Code.');

        const uploadRes = await fetch(`${API_URL}/analysis/complete`, {
            method: 'POST',
            body: formData
        });

        if (!uploadRes.ok) throw new Error(await uploadRes.text());
        const uploadData = await uploadRes.json();
        const analysisId = uploadData.data.analysis_id;

        // Download PDF
        console.log('⬇️ Downloading Enhanced PDF...');
        const pdfRes = await fetch(`${API_URL}/optimizer/download-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                analysis_id: analysisId,
                optimized_text: "• Enhanced bullet point 1\n• Enhanced bullet point 2"
            })
        });

        if (!pdfRes.ok) throw new Error(await pdfRes.text());

        const buffer = await pdfRes.arrayBuffer();
        console.log('✅ PDF Download successful! Size:', buffer.byteLength);

        if (buffer.byteLength > 1000) {
            console.log('✅ Size indicates valid content generation.');
        } else {
            console.warn('⚠️ PDF size is suspiciously small.');
        }

        const outputPath = path.join(__dirname, 'test_enhanced.pdf');
        fs.writeFileSync(outputPath, Buffer.from(buffer));
        console.log(`Saved to ${outputPath}`);

    } catch (err) {
        console.error('❌ Test Failed:', err);
        fs.writeFileSync('test_error.log', `Test Failed: ${err.message}\nStack: ${err.stack}`);
    } finally {
        if (fs.existsSync(resumePath)) fs.unlinkSync(resumePath);
    }
}

testEnhancedPdf();
