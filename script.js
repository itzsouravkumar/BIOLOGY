document.getElementById('searchBtn').addEventListener('click', function () {
    const geneName = document.getElementById('geneSearch').value;
    fetchGeneData(geneName);
    fetchGeneApplications(geneName);
});

document.getElementById('geneSearch').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const geneName = document.getElementById('geneSearch').value;
        fetchGeneData(geneName);
        fetchGeneApplications(geneName);
    }
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

        if (geneIds.length > 1) {
            let optionsHtml = '<h3>Multiple genes found:</h3><ul>';
            geneIds.forEach(geneId => {
                optionsHtml += `<li style="list-style: none; display: inline;"> <button class="button" onclick="selectGene('${geneId}')">${geneId}</button></li>`;
            });
            optionsHtml += '</ul>';
            document.getElementById('geneInfo').innerHTML = optionsHtml;
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

async function selectGene(geneId) {
    const summaryResponse = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gene&id=${geneId}&retmode=json`);
    const summaryData = await summaryResponse.json();
    const geneDetails = summaryData.result[geneId];
    displayGeneInfo(geneDetails);
}

function displayGeneInfo(geneDetails) {
    const geneInfoDiv = document.getElementById('geneInfo');
    geneInfoDiv.innerHTML = `
        <h2>${geneDetails.name || 'Unknown Name'}</h2>
        ${geneDetails.description ? `<p><strong>Description:</strong> ${geneDetails.description}</p>` : ''}
        ${geneDetails.chromosome ? `<p><strong>Chromosome:</strong> ${geneDetails.chromosome}</p>` : ''}
        ${geneDetails.maplocation ? `<p><strong>Map Location:</strong> ${geneDetails.maplocation}</p>` : ''}
        ${geneDetails.organism?.commonname ? `<p><strong>Organism Common Name:</strong> ${geneDetails.organism.commonname}</p>` : ''}
        ${geneDetails.organism?.scientificname ? `<p><strong>Organism Scientific Name:</strong> ${geneDetails.organism.scientificname}</p>` : ''}
        ${geneDetails.uid ? `<p><strong>UID:</strong> ${geneDetails.uid}</p>` : ''}
        ${geneDetails.summary ? `<p><strong>Summary:</strong> ${geneDetails.summary}</p>` : ''}
    `;
}

async function fetchGeneApplications(geneName) {
    try {
        const response = await fetch(`https://api.platform.opentargets.org/api/v4/graphql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `
                query geneApplications($geneName: String!) {
                    target(ensemblId: $geneName) {
                        id
                        approvedSymbol
                        associatedDiseases {
                            rows {
                                disease {
                                    name
                                    therapeuticAreas {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }`,
                variables: { geneName: geneName }
            })
        });
        const data = await response.json();
        displayGeneApplications(data.data.target);
    } catch (error) {
        console.error('Error fetching gene applications:', error);
        document.getElementById('geneApplications').innerText = 'An error occurred while fetching gene applications.';
    }
}

function displayGeneApplications(geneData) {
    const geneApplicationsDiv = document.getElementById('geneApplications');

    if (!geneData || !geneData.associatedDiseases.rows.length) {
        geneApplicationsDiv.innerHTML = '<p>No applications found for this gene.</p>';
        return;
    }

    geneApplicationsDiv.innerHTML = '<h2>Applications</h2>';
    geneData.associatedDiseases.rows.forEach(disease => {
        geneApplicationsDiv.innerHTML += `
            <p><strong>${disease.disease.name}</strong> - Application in therapeutic area: ${disease.disease.therapeuticAreas.map(area => area.name).join(', ')}</p>
        `;
    });
}
