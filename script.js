function fetchDatas(geneName) {
    fetchGeneData(geneName);
    fetchGeneApplications(geneName);
    fetchMoreGeneDetails(geneName);
}

document.getElementById('searchBtn').addEventListener('click', function () {
    const geneName = document.getElementById('geneSearch').value;
    fetchDatas(geneName);
});

document.getElementById('geneSearch').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const geneName = document.getElementById('geneSearch').value;
        fetchDatas(geneName);
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
    console.log(summaryData);
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


async function fetchMoreGeneDetails(accession) {
    try {
        const moreDetailsResponse = await fetch(`https://api.ncbi.nlm.nih.gov/datasets/v2/genome/accession/${accession}/dataset_report`);
        const moreDetailsData = await moreDetailsResponse.json();
        
        displayMoreDetails(moreDetailsData);
    } catch (error) {
        console.error('Error fetching more details:', error);
        document.getElementById('moreDetails').innerText = 'An error occurred while fetching more details.';
    }
}

function displayMoreDetails(data) {
    const moreDetailsDiv = document.getElementById('moreDetails');
    
    if (!data || !data.reports || data.reports.length === 0) {
        moreDetailsDiv.innerHTML = '<p>No additional details available for this accession.</p>';
        return;
    }
    
    const report = data.reports[0];
    const { accession, organism, assembly_info, assembly_stats, organelle_info, annotation_info } = report;

    moreDetailsDiv.innerHTML = `
        <h2>More Details</h2>
        <p><strong>Accession:</strong> ${accession || 'N/A'}</p>
        
        <h3>Organism Information</h3>
        <p><strong>Scientific Name:</strong> ${organism?.organism_name || 'N/A'}</p>
        <p><strong>Common Name:</strong> ${organism?.common_name || 'N/A'}</p>
        <p><strong>Tax ID:</strong> ${organism?.tax_id || 'N/A'}</p>

        <h3>Assembly Information</h3>
        <p><strong>Assembly Name:</strong> ${assembly_info?.assembly_name || 'N/A'}</p>
        <p><strong>Type:</strong> ${assembly_info?.assembly_type || 'N/A'}</p>
        <p><strong>Status:</strong> ${assembly_info?.assembly_status || 'N/A'}</p>
        <p><strong>Description:</strong> ${assembly_info?.description || 'N/A'}</p>
        <p><strong>Release Date:</strong> ${assembly_info?.release_date || 'N/A'}</p>
        <p><strong>Synonym:</strong> ${assembly_info?.synonym || 'N/A'}</p>
        
        <h3>Assembly Statistics</h3>
        <p><strong>Total Chromosomes:</strong> ${assembly_stats?.total_number_of_chromosomes || 'N/A'}</p>
        <p><strong>Total Sequence Length:</strong> ${assembly_stats?.total_sequence_length || 'N/A'}</p>
        <p><strong>GC Content (%):</strong> ${assembly_stats?.gc_percent || 'N/A'}</p>

        <h3>Organelle Information</h3>
        ${organelle_info && organelle_info.length > 0 ? 
            organelle_info.map(organelle => `
                <p><strong>Organelle:</strong> ${organelle.description}</p>
                <p><strong>Sequence Length:</strong> ${organelle.total_seq_length}</p>
                <p><strong>Submitter:</strong> ${organelle.submitter}</p>
            `).join('') : '<p>No organelle information available.</p>'}
        
        <h3>Annotation Information</h3>
        <p><strong>Provider:</strong> ${annotation_info?.provider || 'N/A'}</p>
        <p><strong>Release Date:</strong> ${annotation_info?.release_date || 'N/A'}</p>
        <p><strong>Total Gene Count:</strong> ${annotation_info?.stats?.gene_counts?.total || 'N/A'}</p>
        <p><strong>Protein Coding Genes:</strong> ${annotation_info?.stats?.gene_counts?.protein_coding || 'N/A'}</p>
        <p><strong>Non-coding Genes:</strong> ${annotation_info?.stats?.gene_counts?.non_coding || 'N/A'}</p>
        <p><strong>Pseudogenes:</strong> ${annotation_info?.stats?.gene_counts?.pseudogene || 'N/A'}</p>
        <p><strong>Annotation Report:</strong> <a href="${annotation_info?.report_url}" target="_blank">Link</a></p>
    `;
}