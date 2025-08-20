import React, { useState, useEffect } from 'react';
import { pb } from '../../config';
import { useTeams } from '../../hooks/teams/useTeams';
import { fetchCurrentEdition } from '../../hooks/admin/editionHandlers';

const GroupSection = ({ title, teams, groupTeams, onAssign, group, isLoading }) => {
  const [selectedTeam, setSelectedTeam] = useState('');
  
  return (
    <div className="bg-white rounded-lg shadow p-4 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      
      {/* Add team section */}
      <div className="flex gap-2 mb-4">
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="flex-1 p-2 border rounded text-sm"
          disabled={isLoading}
        >
          <option value="">Seleccionar equipo</option>
          {teams.map(team => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            if (selectedTeam) {
              onAssign(selectedTeam, group);
              setSelectedTeam('');
            }
          }}
          disabled={!selectedTeam || isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-300"
        >
          Agregar
        </button>
      </div>

      {/* Teams list */}
      <div className="space-y-2">
        {groupTeams.map(team => (
          <div key={team.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              {team.logo && (
                <img 
                  src={pb.getFileUrl(team, team.logo)} 
                  alt={team.name} 
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <span>{team.name}</span>
            </div>
            <button
              onClick={() => onAssign(team.id, group, true)}
              disabled={isLoading}
              className="text-red-500 hover:text-red-600 text-sm disabled:text-gray-400"
            >
              Remover
            </button>
          </div>
        ))}
        {groupTeams.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">
            No hay equipos asignados
          </p>
        )}
      </div>
    </div>
  );
};

const AdminGroups = () => {
  const { teams, loading: teamsLoading, refreshTeams } = useTeams();
  const [groupATeams, setGroupATeams] = useState([]);
  const [groupBTeams, setGroupBTeams] = useState([]);
  const [leagueTeams, setLeagueTeams] = useState([]); // for league format
  const [goldGroupTeams, setGoldGroupTeams] = useState([]);
  const [silverGroupTeams, setSilverGroupTeams] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState({
    A: false,
    B: false,
    GOLD: false,
    SILVER: false
  });

  useEffect(() => {
    const init = async () => {
      const ed = await fetchCurrentEdition();
      console.log('Current edition fetched in AdminGroups:', ed);
      setEdition(ed);
      if (ed?.format === 'league') {
        await loadLeagueAssignments(ed.id);
      } else {
        await loadGroupAssignments();
      }
    };
    init();
  }, []);

  const [edition, setEdition] = useState(null);

  // Debug render
  useEffect(()=>{
    console.log('AdminGroups render edition state:', edition);
  }, [edition]);

  const loadLeagueAssignments = async () => {
    try {
      const records = await pb.collection('table').getFullList({
        expand: 'team',
        sort: 'created',
      });
      setLeagueTeams(records.map(r=>r.expand.team).filter(Boolean));
    } catch(err){ console.error(err); }
  };

  const loadGroupAssignments = async () => {
    try {
      // Load group A teams
      const groupAStats = await pb.collection('group_a_stats').getFullList({
        expand: 'team',
        sort: 'created'
      });
      setGroupATeams(groupAStats.map(stat => stat.expand.team).filter(Boolean));

      // Load group B teams
      const groupBStats = await pb.collection('group_b_stats').getFullList({
        expand: 'team',
        sort: 'created'
      });
      setGroupBTeams(groupBStats.map(stat => stat.expand.team).filter(Boolean));

      // Load gold group teams
      const goldStats = await pb.collection('gold_group_stats').getFullList({
        expand: 'team',
        sort: 'created'
      });
      setGoldGroupTeams(goldStats.map(stat => stat.expand.team).filter(Boolean));

      // Load silver group teams
      const silverStats = await pb.collection('silver_group_stats').getFullList({
        expand: 'team',
        sort: 'created'
      });
      setSilverGroupTeams(silverStats.map(stat => stat.expand.team).filter(Boolean));
    } catch (error) {
      console.error('Error loading group assignments:', error);
    }
  };

  const handleTeamAssignment = async (teamId, group, isRemoving = false) => {
    // Set loading state for the specific group
    setLoadingGroups(prev => ({
      ...prev,
      [group]: true
    }));

    try {
      if(edition?.format==='league'){
        // add/remove in table collection
        if(isRemoving){
          const recs = await pb.collection('table').getFullList({filter:`team="${teamId}"`});
          for(const r of recs){ await pb.collection('table').delete(r.id);}  
        }else{
          // create if not exists
          const existing = await pb.collection('table').getFullList({filter:`team="${teamId}"`});
          if(existing.length===0){
            await pb.collection('table').create({team:teamId});
          }
        }
        await loadLeagueAssignments();
        return;
      }
      // If isRemoving is true, we're removing the team from the specified group
      if (isRemoving) {
        let collectionToRemoveFrom;
        switch (group) {
          case 'A':
            collectionToRemoveFrom = 'group_a_stats';
            break;
          case 'B':
            collectionToRemoveFrom = 'group_b_stats';
            break;
          case 'GOLD':
            collectionToRemoveFrom = 'gold_group_stats';
            break;
          case 'SILVER':
            collectionToRemoveFrom = 'silver_group_stats';
            break;
          default:
            throw new Error('Invalid group');
        }

        const records = await pb.collection(collectionToRemoveFrom).getFullList({
          filter: `team="${teamId}"`
        });
        
        for (const record of records) {
          await pb.collection(collectionToRemoveFrom).delete(record.id);
        }
      } else {
        // Adding team to a group - create initial stats record
        const initialStats = {
          team: teamId,
          won_matches: 0,
          lost_matches: 0,
          drawn_matches: 0,
          scored_goals: 0,
          conceived_goals: 0
        };

        // Determine target collection based on group
        let targetCollection;
        switch (group) {
          case 'A':
            targetCollection = 'group_a_stats';
            break;
          case 'B':
            targetCollection = 'group_b_stats';
            break;
          case 'GOLD':
            targetCollection = 'gold_group_stats';
            break;
          case 'SILVER':
            targetCollection = 'silver_group_stats';
            break;
          default:
            throw new Error('Invalid group');
        }

        // Check if team already exists in the target group
        const existingRecords = await pb.collection(targetCollection).getFullList({
          filter: `team="${teamId}"`
        });

        // Only add if team is not already in the group
        if (existingRecords.length === 0) {
          await pb.collection(targetCollection).create(initialStats);
        }
      }

      // Reload only the affected groups
      await loadGroupAssignments();
    } catch (error) {
      console.error('Error assigning team to group:', error);
    } finally {
      // Clear loading state for the specific group
      setLoadingGroups(prev => ({
        ...prev,
        [group]: false
      }));
    }
  };

  if (teamsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Grupos</h1>
      {edition?.format==='league' ? (
        <GroupSection
          title="Tabla General"
          teams={teams}
          groupTeams={leagueTeams}
          onAssign={handleTeamAssignment}
          group="LEAGUE"
          isLoading={loadingGroups.LEAGUE}
        />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GroupSection
          title="Grupo A"
          teams={teams}
          groupTeams={groupATeams}
          onAssign={handleTeamAssignment}
          group="A"
          isLoading={loadingGroups.A}
        />

        <GroupSection
          title="Grupo B"
          teams={teams}
          groupTeams={groupBTeams}
          onAssign={handleTeamAssignment}
          group="B"
          isLoading={loadingGroups.B}
        />

        <GroupSection
          title="Grupo Oro"
          teams={teams}
          groupTeams={goldGroupTeams}
          onAssign={handleTeamAssignment}
          group="GOLD"
          isLoading={loadingGroups.GOLD}
        />

        <GroupSection
          title="Grupo Plata"
          teams={teams}
          groupTeams={silverGroupTeams}
          onAssign={handleTeamAssignment}
          group="SILVER"
          isLoading={loadingGroups.SILVER}
        />
      </div>
      )}
    </div>
  );
};

export default AdminGroups; 