# NASA process mapping

OrbitGuard is inspired by the general pattern of decision support, scenario comparison, and record keeping. It does not reproduce NASA’s operational systems and has no NASA affiliation, endorsement, certification, or data connection.

| Operational concept | OrbitGuard status | What OrbitGuard actually has | What is missing |
| --- | --- | --- | --- |
| Mission configuration trade study | Simplified | Manual altitude/inclination/duration scenarios | Mission constraints, trajectory design, validated optimization. |
| Orbital analysis | Simplified | Circular two-body values from altitude | State vector, perturbations, propagation, maneuver modeling. |
| Environmental assessment | Conceptual heuristic | Two geometry rules for drag/radiation context | Density/space-weather models, spacecraft properties, flux/dose models. |
| Conjunction screening | Not implemented | None | Catalog, screening volume, primary/secondary states, TCA, miss distance. |
| Collision likelihood / Pc | Not implemented | None | Covariance, hard-body radius, uncertainty propagation, Pc algorithm. |
| Mitigation planning | Not implemented | Scenario configuration comparison | Maneuver planning, maneuver screening, command process, flight dynamics validation. |
| Decision and history | Prototype implemented | Server-authoritative snapshots and MongoDB history | Operational governance, identity, review roles, signatures, resilient audit controls. |

NASA describes conjunction assessment as screening predicted positions against known objects, followed by risk assessment and possible mitigation. It distinguishes a close approach from collision risk; Pc relies on ephemeris uncertainty [NASA CARA](https://www.nasa.gov/cara/). NASA’s handbook identifies covariance as the stochastic characterization of errors in a state estimate [CA Best Practices Handbook](https://www.nasa.gov/wp-content/uploads/2024/01/oce-51-nasa-spacecraft-conjunction-assessment.pdf). ESA likewise describes operational services using orbit files, environmental data, object properties, uncertainty, miss distance, and collision probability [ESA](https://www.esa.int/content/view/full/413425).

Therefore, “close approach” and “Pc” are not interchangeable terms and neither is calculated by OrbitGuard.
