document.getElementById('searchBtn').addEventListener('click', function () {
    const geneName = document.getElementById('geneSearch').value;
    fetchGeneData(geneName);
});

async function fetchGeneData(geneName) {
    try {
        const searchResponse = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=gene&term=${geneName}&retmode=json`);
        const searchData = await searchResponse.json();
        const geneIds = searchData.esearchresult.idlist;

        if (geneIds.length === 0) {
            document.getElementById('geneInfo').innerText = 'No genes found for this search term.';
            return;
        }

        const geneId = geneIds[0];
        const summaryResponse = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gene&id=${geneId}&retmode=json`);
        const summaryData = await summaryResponse.json();
        const geneDetails = summaryData.result[geneId];

        displayGeneInfo(geneDetails);
    } catch (error) {
        console.error('Error fetching gene data:', error);
        document.getElementById('geneInfo').innerText = 'An error occurred while fetching gene data.';
    }
}

function displayGeneInfo(geneDetails) {
    const geneInfoDiv = document.getElementById('geneInfo');
    console.log(geneDetails);

    geneInfoDiv.innerHTML = `
        <h2>${geneDetails.name || 'Unknown Name'}</h2>
        ${geneDetails.description ? `<p><strong>Description:</strong> ${geneDetails.description}</p>` : ''}
        ${geneDetails.chromosome ? `<p><strong>Chromosome:</strong> ${geneDetails.chromosome}</p>` : ''}
        ${geneDetails.maplocation ? `<p><strong>Map Location:</strong> ${geneDetails.maplocation}</p>` : ''}
        ${geneDetails.organism?.commonname ? `<p><strong>Organism Common Name:</strong> ${geneDetails.organism.commonname}</p>` : ''}
        ${geneDetails.organism?.scientificname ? `<p><strong>Organism Scientific Name:</strong> ${geneDetails.organism.scientificname}</p>` : ''}

        ${geneDetails.locationhist && geneDetails.locationhist.length ?
            `<p><strong>Location History:</strong> ${geneDetails.locationhist.map(loc =>
                `${loc.annotationrelease || 'N/A'}, ${loc.chraccver || 'N/A'}, ${loc.chrlocation || 'N/A'}`).join('; ')}</p>`
            : ''}

        ${geneDetails.genomicinfo && geneDetails.genomicinfo.length ?
            `<p><strong>Genomic Info:</strong> ${geneDetails.genomicinfo.map(info =>
                `${info.chrstart || 'N/A'} - ${info.chrstop || 'N/A'}`).join(', ')}</p>`
            : ''}
        
        ${geneDetails.uid ? `<p><strong>UID:</strong> ${geneDetails.uid}</p>` : ''}
        ${geneDetails.summary ? `<p><strong>Summary:</strong> ${geneDetails.summary}</p>` : ''}
    `;
}

// JavaScript code for future features
document.getElementById('searchBtn').addEventListener('click', () => {
    const query = document.getElementById('geneSearch').value;
    document.getElementById('geneInfo').innerHTML = `<p>Searching for: ${query}</p>`;
});

