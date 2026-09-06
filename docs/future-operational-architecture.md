# Future operational architecture

This is a requirements-oriented gap map, not a claim that the components exist today.

An operationally credible successor would need validated interfaces and governance around: authoritative orbit/state data; orbit determination and propagation with force models; catalog and conjunction data ingestion; state and covariance quality management; TCA/miss-distance/Pc computation; spacecraft and hard-body characteristics; environmental and space-weather inputs; maneuver design and post-maneuver screening; role-based workflow, approvals, identity, logging, monitoring, and incident procedures.

NASA’s CA handbook and ESA’s service description support the importance of orbit state, covariance/uncertainty, screening, collision probability, and mitigation workflow. Exact requirements depend on mission, regulator, data providers, and safety authority; this document does not set certification requirements. OrbitGuard’s clean seam is the service layer: replace or supplement its deterministic services only after scientific validation, source licensing, test data, and mission-assurance review.
