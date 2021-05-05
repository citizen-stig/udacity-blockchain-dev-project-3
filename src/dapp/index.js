import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';

(async () => {
    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            display('Operational Status', 'Check if contract is operational', [{
                label: 'Operational Status',
                error: error,
                value: result
            }]);
        });


        populateFlights(contract.flights);

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [{
                    label: 'Flight Status Request',
                    error: error,
                    value: result.flight + ' ' + result.timestamp
                }]);
            });
        })

        DOM.elid('buy-insurance').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            console.log("User clicked 'Buy Insurance")
            // Write transaction
            contract.buyInsurance(flight, "0.5", (error, result) => {
                console.log("Bought insurances", result, error);
                display('Insurance', 'Bought insurance', [{
                    label: 'Flight Status Request',
                    error: error,
                    value: result.flight + ' ' + result.timestamp
                }]);
            });
        })


    });
})();

function populateFlights(flights) {
    // let insuranceSelect = DOM.elid('insurance-flight')
    let flightStatusSelect = DOM.elid('flight-number');
    Object.keys(flights).forEach(flight => {
        // insuranceSelect.appendChild(DOM.makeElement('option', {value: flight}, flight));
        flightStatusSelect.appendChild(DOM.makeElement('option', {value: flight}, flight));

    });
}


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className: 'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);
}
